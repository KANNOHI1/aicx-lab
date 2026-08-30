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

/* 章→型の最小費用流。mock プール優先（費用0）、lesson 併用は費用10、新規作問は費用1000。
   章と型のあいだに (章,型) の中継ノードを置き、その容量で「1セットが1つの (章,型) から取れる上限」を縛る。
   上限＝その (章,型) が持つ Section の数。制約①（同セットに同Sec同型を入れない）から導かれる必然で、
   これを流量段階で教えないと、Section が1つしかないセルに2問を割り当てる解が出て後段が詰む。 */
function solve(CH,TY,capFn,midCap){
  const MID=(c,t)=>14+(c-1)*7+(t-1);   /* 0=S, 1-6=章, 7-13=型, 14-55=(章,型)中継, 56=T */
  const N=14+42+1,S=0,T=14+42,g=[];for(let i=0;i<N;i++)g.push([]);
  const add=(u,v,c,w)=>{g[u].push({v,c,w,r:g[v].length});g[v].push({v:u,c:0,w:-w,r:g[u].length-1});};
  for(let c=1;c<=6;c++)add(S,c,CH[c-1],0);
  for(let t=1;t<=7;t++)add(6+t,T,TY[t-1],0);
  const arc={};
  for(let c=1;c<=6;c++)for(let t=1;t<=7;t++){
    const m=MID(c,t);add(c,m,midCap?midCap(c,t):1e9,0);
    arc[c+','+t]=[];
    ['mock','both','mock2','new'].forEach((k,i)=>{const cp=capFn(c,t,k);add(m,6+t,cp,[0,10,20,1000][i]);
      arc[c+','+t].push({k,cp,u:m,i:g[m].length-1});});}
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
/* (章,型) が持つ Section の数＝1セットがそのセルから取れる上限 */
const SECN={};QB.forEach(q=>{const k=q.ch+','+q.type;(SECN[k]=SECN[k]||new Set()).add(q.sec);});
const secCount=(c,t)=>(SECN[c+','+t]||{size:0}).size;

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
  const r=solve(S_.CH,S_.TY,(c,t,k)=>k==='new'?0:share(c,t,k),secCount);
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

/* Section 割当を「章まるごと」で厳密に解く。
   制約① 同じセットに同じ (Section,型) を2問入れない
   制約② 同じ Section は1セットに2問まで
   ②は Section が章に属するため章の中でしか効かない。よって章が正しい分解単位になる。
   （(章,型) セル単位で順に解くと、先に解いた型が Section 枠を食って後の型が②を満たせなくなる。
     貪欲も同じ理由で「在庫はあるのに失敗する」——2026-08-30 F11 で実測。）
   規模は1章あたり高々 3セット×10問・Section は4〜7個なので、MRV 付きバックトラックで全探索する。 */
let budgetHit=false;                    // 探索が上限に達したか（infeasible なら証明に時間がかかるため打ち切る）
function solveChapter(cells, secInSet, hard2){
  let steps=0;const LIMIT=200000;
  const slots=[];
  for(const {ty,need} of cells)
    for(const pool of Object.keys(need).sort())
      need[pool].forEach((n,i)=>{for(let k=0;k<n;k++)slots.push({ty,pool,i});});
  const stock={};                       // ty -> sec -> pool -> 残数
  for(const {ty,bySec} of cells){stock[ty]={};
    for(const sec in bySec){stock[ty][sec]={};for(const p in bySec[sec])stock[ty][sec][p]=bySec[sec][p].length;}}
  const usedST=[{},{},{}];              // set -> ty -> Set(sec)   ①
  const cnt=[{},{},{}];                 // set -> sec -> 本セルで積んだ数（②は secInSet と合算）
  const assign=new Array(slots.length).fill(null);
  const cands=k=>{const {ty,pool,i}=slots[k];
    return Object.keys(stock[ty]).sort((a,b)=>Number(a)-Number(b))
      .filter(sec=>(stock[ty][sec][pool]||0)>0
        && !(usedST[i][ty]&&usedST[i][ty].has(sec))
        && (!hard2 || ((secInSet[i][sec]||0)+(cnt[i][sec]||0))<2));};
  const dfs=done=>{
    if(done===slots.length)return true;
    if(++steps>LIMIT){budgetHit=true;return false;}
    let best=-1,bc=null;                // MRV: 候補の最も少ないスロットから決める
    for(let k=0;k<slots.length;k++){if(assign[k])continue;
      const c=cands(k);if(!bc||c.length<bc.length){best=k;bc=c;if(!c.length)break;}}
    if(!bc.length)return false;
    const {ty,pool,i}=slots[best];
    bc.sort((x,y)=>(stock[ty][x][pool]-stock[ty][y][pool])||Number(x)-Number(y));
    for(const sec of bc){
      assign[best]={sec};stock[ty][sec][pool]--;
      (usedST[i][ty]=usedST[i][ty]||new Set()).add(sec);cnt[i][sec]=(cnt[i][sec]||0)+1;
      if(dfs(done+1))return true;
      cnt[i][sec]--;usedST[i][ty].delete(sec);stock[ty][sec][pool]++;assign[best]=null;
    }
    return false;
  };
  return dfs(0)?slots.map((s,k)=>({...s,sec:assign[k].sec})):null;
}

const byCh={};
for(const key of ctOrder){const [ch,ty]=key.split(',');
  const bySec={};
  QB.filter(q=>q.ch==ch&&q.type==ty).forEach(q=>{
    (bySec[q.sec]=bySec[q.sec]||{})[q.pool]=((bySec[q.sec]||{})[q.pool]||[]).concat(q);});
  Object.values(bySec).forEach(o=>Object.values(o).forEach(a=>a.sort((u,v)=>u.id.localeCompare(v.id))));
  const need={};for(const pool in CT[key])need[pool]=CT[key][pool].slice();
  (byCh[ch]=byCh[ch]||[]).push({ty,bySec,need});}

for(const ch of Object.keys(byCh).sort((a,b)=>Number(a)-Number(b))){
  const cells=byCh[ch];
  budgetHit=false;
  let sol=solveChapter(cells,secInSet,true), relaxed=false;
  if(!sol){sol=solveChapter(cells,secInSet,false);relaxed=true;}
  if(!sol){dupForced.push('第'+ch+'章 → '+(budgetHit?'探索上限に到達（在庫を増やすか制約を見直す）':'Section を分けきれない（①も満たせない）'));
    sol=[];
    for(const {ty,bySec,need} of cells){
      const left={};Object.keys(bySec).forEach(s=>{left[s]={};for(const p in bySec[s])left[s][p]=bySec[s][p].length;});
      for(const pool of Object.keys(need).sort())need[pool].forEach((n,i)=>{
        for(let k=0;k<n;k++){
          const sec=Object.keys(left).sort((x,y)=>Number(x)-Number(y)).find(s=>(left[s][pool]||0)>0);
          if(!sec){shortage.push('ch'+ch+'型'+ty+'('+pool+') 模試'+(i+1)+' 在庫切れ');continue;}
          left[sec][pool]--;sol.push({ty,pool,i,sec});}});}
  }else if(relaxed){
    dupForced.push('第'+ch+'章 → 同じ Section が1セットに3問以上（②のみ違反）');}
  const cellOf={};cells.forEach(c=>cellOf[c.ty]=c);
  sol.sort((a,b)=>a.i-b.i||Number(a.ty)-Number(b.ty)||Number(a.sec)-Number(b.sec)||a.pool.localeCompare(b.pool));
  for(const {ty,pool,i,sec} of sol){
    const q=cellOf[ty].bySec[sec][pool].shift();
    secInSet[i][sec]=(secInSet[i][sec]||0)+1;
    PLAN[i].push(q.id);}
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
