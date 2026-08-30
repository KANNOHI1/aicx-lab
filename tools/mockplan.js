/* 模試セット割り付け（Build C2 で作成）
   使い方: node tools/mockplan.js         → ①②③の ID 列と検算を出力
   なぜ一括で解くか: ①だけ先に組むと、章×型の両方の配分を同時に満たす問題が
   ②③で足りなくなる。3セット分（125問）を最小費用流で先に割り付けてから切り出す。 */
const fs=require('fs'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const beg=html.indexOf('const QB=['), end=html.indexOf('\n];',beg);
const QB=eval(html.slice(beg+9,end+2));

const SETS=[
 {id:'m1',n:50,CH:[8,6,10,8,8,10],TY:[12,8,8,7,7,4,4]},
 {id:'m2',n:50,CH:[8,6,10,8,8,10],TY:[12,8,8,7,7,4,4]},
 {id:'m3',n:25,CH:[4,3,5,4,4,5], TY:[6,4,4,4,3,2,2]}
];
const AGG={CH:[20,15,25,20,20,25],TY:[30,20,20,18,17,10,10]};
const cap=(pool,c,t)=>QB.filter(q=>q.pool===pool&&q.ch===c&&q.type===t).length;

/* 章→型の最小費用流。mock プール優先（費用0）、lesson 併用は費用10、新規作問は費用1000 */
function solve(CH,TY,capFn){
  const N=15,S=0,T=14,g=[];for(let i=0;i<N;i++)g.push([]);
  const add=(u,v,c,w)=>{g[u].push({v,c,w,r:g[v].length});g[v].push({v:u,c:0,w:-w,r:g[u].length-1});};
  for(let c=1;c<=6;c++)add(S,c,CH[c-1],0);
  for(let t=1;t<=7;t++)add(6+t,T,TY[t-1],0);
  const arc={};
  for(let c=1;c<=6;c++)for(let t=1;t<=7;t++){arc[c+','+t]=[];
    ['mock','both','mock2','new'].forEach((k,i)=>{const cp=capFn(c,t,k);add(c,6+t,cp,[0,10,20,1000][i]);
      arc[c+','+t].push({k,cp,u:c,i:g[c].length-1});});}
  let flow=0;
  for(;;){const d=Array(N).fill(1e18),pv=Array(N).fill(-1),pe=Array(N).fill(-1);d[S]=0;
    for(let it=0;it<N;it++)for(let u=0;u<N;u++){if(d[u]>=1e18)continue;
      g[u].forEach((e,i)=>{if(e.c>0&&d[u]+e.w<d[e.v]){d[e.v]=d[u]+e.w;pv[e.v]=u;pe[e.v]=i;}});}
    if(d[T]>=1e18)break;
    let f=1e18;for(let v=T;v!==S;v=pv[v])f=Math.min(f,g[pv[v]][pe[v]].c);
    for(let v=T;v!==S;v=pv[v]){const e=g[pv[v]][pe[v]];e.c-=f;g[v][e.r].c+=f;}flow+=f;}
  const out={};
  for(const key in arc)for(const a of arc[key]){const used=a.cp-g[a.u][a.i].c;
    if(used>0){out[key]=out[key]||{};out[key][a.k]=used;}}
  return {flow,out};
}

const AG=solve(AGG.CH,AGG.TY,(c,t,k)=>k==='new'?99:cap(k,c,t));
const newNeeded=Object.values(AG.out).reduce((s,o)=>s+(o.new||0),0);
console.log('3セット一括: flow='+AG.flow+' / 新規作問='+newNeeded);

const rem={};for(const k in AG.out)rem[k]={...AG.out[k]};
const byId=Object.fromEntries(QB.map(q=>[q.id,q]));

/* 2026-08-30 の回跨ぎレビューが「同じセットに似た問題が並ぶ」と名指しした組。
   (sec,型) の一致では捕まらない意味的な近さなので、明示的に離す。
   ※ m04-08≒m10-01 と m04-03≒m09-03 は F シリーズの本文差し替えで論点自体が別になったが、
     再発防止のため制約としては残す。 */
const NODUP=[['m04-08','m10-01'],['m05-08','c07-02'],['s19-02','c07-01'],['m04-03','m09-03']];

/* ---- セットごとの (章,型,プール) 別必要数を先に確定させる ---- */
let left=125;
const rem2={};for(const k in AG.out)rem2[k]={...AG.out[k]};
const CELLS={};                                   // 'ch,型,pool' -> [m1の必要数, m2, m3]
SETS.forEach((S_,idx)=>{
  const share=(c,t,k)=>{const a=(rem2[c+','+t]||{})[k==='mock2'?'mock':k]||0;
    if(k==='both') return a;
    const q=idx<SETS.length-1 ? Math.round(a*S_.n/left) : a;   // 取り分
    return k==='mock' ? q : a-q;                                // mock2 = 取り分超過（費用高）
  };
  const r=solve(S_.CH,S_.TY,(c,t,k)=>k==='new'?0:share(c,t,k));
  left-=S_.n;
  for(const key in r.out)for(const k in r.out[key])rem2[key][k==='mock2'?'mock':k]-=r.out[key][k];
  for(const key in r.out)for(const k in r.out[key]){
    const ck=key+','+(k==='mock2'?'mock':k);
    (CELLS[ck]=CELLS[ck]||[0,0,0])[idx]+=r.out[key][k];}
});

/* ---- Section の割り当て ----
   同じ Section・同じ型の重複は「同じ (章,型)」の中でしか起こらない（型が同じでなければ重複扱いしない）。
   よって (章,型) 単位で解く。pool（mock / both）は同じ (章,型) の中の内訳にすぎないので、
   pool ごとに分けて解くと片方が先に Section を押さえて詰む。まとめて1つの問題として扱う。
   1つの (章,型) の中で満たすもの:
     - 1セットが同じ Section から2問取らない（＝同Sec同型ゼロ）
     - セットごとの pool 別必要数は崩さない（模試の lesson 再利用比率が変わってしまうため）
   逃げ場の少ない (章,型) から先に配る。 */
const PLAN=[[],[],[]];
const secInSet=[{},{},{}];                        // セット内の Section 使用回数（3問目を避けるため）
const shortage=[],dupForced=[];

const CT={};                                      // 'ch,型' -> {pool: [m1,m2,m3]}
for(const ck in CELLS){const i=ck.lastIndexOf(',');
  const key=ck.slice(0,i),pool=ck.slice(i+1);
  (CT[key]=CT[key]||{})[pool]=CELLS[ck];}

const ctOrder=Object.keys(CT).sort((A,B)=>{
  const slack=k=>{const [ch,ty]=k.split(',');
    const secs=new Set(QB.filter(q=>q.ch==ch&&q.type==ty).map(q=>q.sec));
    const maxNeed=Math.max(...[0,1,2].map(i=>Object.values(CT[k]).reduce((t,d)=>t+d[i],0)));
    return secs.size-maxNeed;};
  return slack(A)-slack(B)||A.localeCompare(B);});

for(const key of ctOrder){
  const [ch,ty]=key.split(',');
  const bySec={};                                 // sec -> {pool: [問題...]}
  QB.filter(q=>q.ch==ch&&q.type==ty).forEach(q=>{
    (bySec[q.sec]=bySec[q.sec]||{})[q.pool]=((bySec[q.sec]||{})[q.pool]||[]).concat(q);});
  const need={};for(const pool in CT[key])need[pool]=CT[key][pool].slice();
  const usedSec=[new Set(),new Set(),new Set()];   // このセットがこの (章,型) で使った Section
  for(;;){
    /* 残り必要数の多い (セット, pool) から埋める */
    const slots=[];
    for(const pool in need)need[pool].forEach((n,i)=>{if(n>0)slots.push({pool,i,n});});
    if(!slots.length)break;
    slots.sort((x,y)=>y.n-x.n||x.i-y.i||x.pool.localeCompare(y.pool));
    const {pool,i:idx}=slots[0];
    const avail=sec=>((bySec[sec]||{})[pool]||[]).length>0;
    let cands=Object.keys(bySec).filter(sec=>avail(sec)&&!usedSec[idx].has(sec)&&(secInSet[idx][sec]||0)<2);
    let forced=false;
    if(!cands.length){                             // Section を分けきれない（feasible 判定が理由を示す）
      cands=Object.keys(bySec).filter(avail);
      if(!cands.length){shortage.push('ch'+ch+'型'+ty+'('+pool+') 模試'+(idx+1)+' 在庫切れ 残'+need[pool][idx]+'問');
        need[pool][idx]=0;continue;}
      forced=true;
    }
    /* そのセットでの使用回数が少ない順 → 在庫の少ない Section から消化 → Section 番号 */
    cands.sort((x,y)=>(secInSet[idx][x]||0)-(secInSet[idx][y]||0)
      ||bySec[x][pool].length-bySec[y][pool].length||Number(x)-Number(y));
    const sec=cands[0];
    bySec[sec][pool].sort((u,v)=>u.id.localeCompare(v.id));
    const q=bySec[sec][pool].shift();
    usedSec[idx].add(sec);secInSet[idx][sec]=(secInSet[idx][sec]||0)+1;
    PLAN[idx].push(q.id);need[pool][idx]--;
    if(forced)dupForced.push('ch'+ch+'型'+ty+' → 模試'+(idx+1)+' で Sec'+sec+' が重複');
  }
}
{const all=PLAN.flat();
 if(new Set(all).size!==all.length)throw new Error('セット間で問題が重複した');
 if(all.length!==125)throw new Error('総数が125問でない: '+all.length);}

/* NODUP の同居が残っていたら、章・型・プールが同じ問題とセット間で入れ替えて離す */
for(const [x,y] of NODUP){
  const si=PLAN.findIndex(ids=>ids.includes(x)&&ids.includes(y));
  if(si<0)continue;
  const qx=byId[x];let done=false;
  for(let sj=0;sj<PLAN.length&&!done;sj++){if(sj===si)continue;
    for(const cid of PLAN[sj]){const qc=byId[cid];
      if(qc.ch!==qx.ch||qc.type!==qx.type||qc.pool!==qx.pool)continue;
      if(PLAN[si].includes(cid))continue;
      PLAN[si][PLAN[si].indexOf(x)]=cid;PLAN[sj][PLAN[sj].indexOf(cid)]=x;done=true;break;}}
  if(!done)console.log('!! NODUP を離せなかった: '+x+' / '+y);
}

if(shortage.length)console.log('!! 候補不足: '+shortage.join(' / '));

/* Section を分けきれなかったセルについて、QB の構成上どうやっても無理なのかを判定する。
   セット内で Section を重複させない ⇒ ある Section は1セットにつき最大1問。
   よって Section x の供給枠は c_x = min(在庫, セット数)。
   完全2部グラフ上の次数制約付き部分グラフが存在する条件（Gale-Ryser）:
     上位 k セットの必要数の合計 ≤ Σ_x min(c_x, k)  を k=1..セット数 で満たすこと。
   例: ch3型4(mock) は必要 5/5/2 問に対し Sec13 の在庫が1問しかないため、
       2セットが5 Section すべてを要求すると必ずどこかが重なる。 */
function feasible(ch,ty,dem){
  const stock={};QB.filter(q=>q.ch==ch&&q.type==ty).forEach(q=>stock[q.sec]=(stock[q.sec]||0)+1);
  const d=dem.filter(x=>x>0).sort((a,b)=>b-a),n=d.length;
  const c=Object.values(stock).map(v=>Math.min(v,n));
  for(let k=1;k<=n;k++){
    const lhs=d.slice(0,k).reduce((a,b)=>a+b,0);
    const rhs=c.reduce((t,v)=>t+Math.min(v,k),0);
    if(lhs>rhs)return {ok:false,stock};
  }
  return {ok:true,stock};
}
console.log('Section を分けきれなかったセル: '+(dupForced.length?'':'なし'));
dupForced.forEach(x=>console.log('  - '+x));
{const bad=[];
 for(const key of Object.keys(CT)){const [ch,ty]=key.split(',');
   const dem=[0,1,2].map(i=>Object.values(CT[key]).reduce((t,d)=>t+d[i],0));
   const f=feasible(ch,ty,dem);
   if(!f.ok)bad.push('ch'+ch+'型'+ty+' 必要'+dem.filter(x=>x>0).join('/')+'問 vs Section在庫'+JSON.stringify(f.stock));}
 console.log('うち QB の構成上どうやっても不可能なもの: '+(bad.length?'':'なし'));
 bad.forEach(x=>console.log('  - '+x));}
{const all=PLAN.flat();
 if(new Set(all).size!==all.length)throw new Error('セット間で問題が重複した');
 if(all.length!==125)throw new Error('総数が125問でない: '+all.length);}

/* NODUP の同居が残っていたら、章・型・プールが同じ問題とセット間で入れ替えて離す */
for(const [x,y] of NODUP){
  const si=PLAN.findIndex(ids=>ids.includes(x)&&ids.includes(y));
  if(si<0)continue;
  const qx=byId[x];let done=false;
  for(let sj=0;sj<PLAN.length&&!done;sj++){if(sj===si)continue;
    for(const cid of PLAN[sj]){const qc=byId[cid];
      if(qc.ch!==qx.ch||qc.type!==qx.type||qc.pool!==qx.pool)continue;
      if(PLAN[si].includes(cid))continue;
      PLAN[si][PLAN[si].indexOf(x)]=cid;PLAN[sj][PLAN[sj].indexOf(cid)]=x;done=true;break;}}
  if(!done)console.log('!! NODUP を離せなかった: '+x+' / '+y);
}

/* 出題順は決定的に混ぜる（章順のままだと並びで範囲が読めてしまう） */
function shuffle(a,seed){let s=seed;const r=()=>(s=(s*1103515245+12345)%2147483648)/2147483648;
  const x=a.slice();for(let i=x.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[x[i],x[j]]=[x[j],x[i]];}return x;}

SETS.forEach((S_,idx)=>{
  const ids=shuffle(PLAN[idx],20260830+idx);
  const qs=ids.map(i=>byId[i]);
  const cnt=f=>qs.reduce((m,q)=>(m[f(q)]=(m[f(q)]||0)+1,m),{});
  const strip=x=>x.replace(/<[^>]+>/g,'');
  let lg=0,st=0;for(const q of qs){const L=q.o.map(o=>strip(o).length),a=L[q.a],mo=Math.max(...L.filter((_,i)=>i!==q.a));
    if(a>mo){lg++;if(a>=mo*1.25)st++;}}
  const byT={},bySec={};qs.forEach(q=>{byT[q.sec+',型'+q.type]=(byT[q.sec+',型'+q.type]||0)+1;bySec[q.sec]=(bySec[q.sec]||0)+1;});
  const dupT=Object.entries(byT).filter(([,v])=>v>1).map(([k])=>'Sec'+k);
  const dup3=Object.entries(bySec).filter(([,v])=>v>2).map(([k,v])=>'Sec'+k+'x'+v);
  console.log('')
console.log('=== '+S_.id+' ('+ids.length+'問) ===');
  console.log('章別',JSON.stringify(cnt(q=>q.ch)),'型別',JSON.stringify(cnt(q=>q.type)),'プール',JSON.stringify(cnt(q=>q.pool)));
  console.log('正解肢単独最長 '+lg+'/'+ids.length+' 強い手がかり '+st+' / 型3順位語なし: '+
    (qs.filter(q=>q.type===3&&!/最も|最初に|優先|まず/.test(q.q)).map(q=>q.id).join(',')||'なし'));
  console.log('同Sec同型: '+(dupT.join(', ')||'なし')+' / 同Sec3問以上: '+(dup3.join(', ')||'なし'));
  console.log("ids:["+ids.map(i=>"'"+i+"'").join(',')+"]");
});
