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
const used=new Set(),secUse={};
/* セル配分どおりに実問題を選ぶ。同一セクションに偏らないよう使用回数の少ない方から取る */
function pick(plan){const out=[];
  for(const key of Object.keys(plan).sort()){const [c,t]=key.split(',').map(Number);
    for(const k of ['mock','mock2','both']){let n=plan[key][k]||0;const pool=k==='mock2'?'mock':k;
      while(n-->0){const cand=QB.filter(q=>q.pool===pool&&q.ch===c&&q.type===t&&!used.has(q.id));
        if(!cand.length){console.log('!! 候補不足',key,k);break;}
        cand.sort((a,b)=>(secUse[a.sec]||0)-(secUse[b.sec]||0)||a.id.localeCompare(b.id));
        const q=cand[0];used.add(q.id);secUse[q.sec]=(secUse[q.sec]||0)+1;out.push(q.id);}}}
  return out;}
/* 出題順は決定的に混ぜる（章順のままだと並びで範囲が読めてしまう） */
function shuffle(a,seed){let s=seed;const r=()=>(s=(s*1103515245+12345)%2147483648)/2147483648;
  const x=a.slice();for(let i=x.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[x[i],x[j]]=[x[j],x[i]];}return x;}

/* mock プールをセット間で比例配分する。先着順にすると①が mock を取り切り、
   ②③の lesson 再利用が上限（1セット30%）を超える */
let left=125;
SETS.forEach((S_,idx)=>{
  const share=(c,t,k)=>{const a=(rem[c+','+t]||{})[k==='mock2'?'mock':k]||0;
    if(k==='both') return a;
    const q=idx<SETS.length-1 ? Math.round(a*S_.n/left) : a;   // 取り分
    return k==='mock' ? q : a-q;                                // mock2 = 取り分超過（費用高）
  };
  const r=solve(S_.CH,S_.TY,(c,t,k)=>k==='new'?0:share(c,t,k));
  left-=S_.n;
  for(const key in r.out)for(const k in r.out[key])rem[key][k==='mock2'?'mock':k]-=r.out[key][k];
  const ids=shuffle(pick(r.out),20260830+idx);
  const qs=ids.map(i=>QB.find(q=>q.id===i));
  const cnt=f=>qs.reduce((m,q)=>(m[f(q)]=(m[f(q)]||0)+1,m),{});
  const strip=x=>x.replace(/<[^>]+>/g,'');
  let lg=0,st=0;for(const q of qs){const L=q.o.map(o=>strip(o).length),a=L[q.a],mo=Math.max(...L.filter((_,i)=>i!==q.a));
    if(a>mo){lg++;if(a>=mo*1.25)st++;}}
  console.log('\n=== '+S_.id+' ('+ids.length+'問) ===');
  console.log('章別',JSON.stringify(cnt(q=>q.ch)),'型別',JSON.stringify(cnt(q=>q.type)),'プール',JSON.stringify(cnt(q=>q.pool)));
  console.log('正解肢単独最長 '+lg+'/'+ids.length+' 強い手がかり '+st+' / 型3順位語なし: '+
    (qs.filter(q=>q.type===3&&!/最も|最初に|優先|まず/.test(q.q)).map(q=>q.id).join(',')||'なし'));
  console.log("ids:["+ids.map(i=>"'"+i+"'").join(',')+"]");
});
