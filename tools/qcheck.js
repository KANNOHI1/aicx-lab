// 横断機械検出（memory: project_aicx_lab_question_quality / final_review_plan ①段）
// モデルに判断させず機械で潰せる項目だけをここで潰す。
const fs=require('fs');
const h=fs.readFileSync('index.html','utf8');
const ev=(re,name)=>{const m=h.match(re); if(!m) throw new Error(name+' が見つからない');
  return eval('('+m[0].replace(/^const \w+=/,'').replace(/;$/,'').replace(/body:L\d+_BODY,?/g,'')+')');};
const QB=ev(/const QB=\[[\s\S]*?\n\];/,'QB');
const GLO=ev(/const GLO=\{[\s\S]*?\n\};/,'GLO');
const MOCKSETS=ev(/const MOCKSETS=\[[\s\S]*?\n\];/,'MOCKSETS');
const SYL=ev(/const SYL=\[[\s\S]*?\n\];/,'SYL');
const LESSONS=ev(/const LESSONS=\[[\s\S]*?\n\];/,'LESSONS');

const bodies={};
for(const m of h.matchAll(/const (L\d+_BODY)\s*=\s*`([\s\S]*?)`;/g)) bodies[m[1]]=m[2];
const strip=t=>t.replace(/<[^>]+>/g,'');
const plain=strip(Object.values(bodies).join('\n'));

const out=[];const add=(k,items)=>out.push({k,n:items.length,items});
const norm=t=>t.replace(/[（）()、。・「」\s]/g,'');

// 1. 長さ手がかり
let sole=0;const strong=[];
for(const q of QB){const L=q.o.map(x=>strip(x).length),a=L[q.a],s=[...L].sort((x,y)=>y-x);
  if(a===s[0]&&s[0]>s[1]){sole++; if(a>=s[1]*1.25)strong.push(q.id+'('+a+'/'+s[1]+')');}}
add('強い長さ手がかり(正解が2位の1.25倍超)',strong);

// 2. 型3の順位語
add('型3の順位語欠落',QB.filter(q=>q.type===3&&!/最も優先|最初に|最優先|真っ先|順序/.test(q.q)).map(q=>q.id));

// 3. 構造
const ids=QB.map(q=>q.id);
add('ID重複',ids.filter((x,i)=>ids.indexOf(x)!==i));
add('選択肢数が4でない',QB.filter(q=>q.o.length!==4).map(q=>q.id+':'+q.o.length));
add('正解indexが範囲外',QB.filter(q=>!(q.a>=0&&q.a<q.o.length)).map(q=>q.id));
add('必須フィールド欠落',QB.filter(q=>!q.q||!q.e||!q.sec||!q.ch||!q.type||!q.pool).map(q=>q.id));
add('ケース字数が120〜250外',QB.filter(q=>q.cs).filter(q=>{const n=q.cs.replace(/\n/g,'').length;return n<120||n>250;}).map(q=>q.id+':'+q.cs.replace(/\n/g,'').length));
add('ケース問題のlimitが180でない',QB.filter(q=>q.cs&&q.limit!==180).map(q=>q.id+':'+q.limit));
add('ケース以外にlimitが付いている',QB.filter(q=>!q.cs&&q.limit).map(q=>q.id));

// 4. 選択肢の重複
add('同一問題内で選択肢が重複',QB.filter(q=>new Set(q.o.map(strip)).size!==q.o.length).map(q=>q.id));

// 5. 設問+ケースが完全一致する別問題
const byQ={};for(const q of QB){const k=norm(strip(q.q+'|'+(q.cs||'')));(byQ[k]=byQ[k]||[]).push(q.id);}
add('設問+ケースが完全一致する別問題',Object.values(byQ).filter(v=>v.length>1).map(v=>v.join('=')));

// 6. 解説の「〜が誤りの理由：」引用が誤答肢に対応するか
// 引用は誤答肢の要約なので完全一致しない。全件走査では誤検知が出る前提の WARN 検査で、
// 目的は「選択肢を書き換えたときに解説との対応が切れた」回帰の検出。
// 編集後は前回出力との差分だけを見ること（memory: project_aicx_lab_question_quality）。
const orphan=[];
for(const q of QB){
  const wrongs=q.o.filter((_,i)=>i!==q.a).map(x=>norm(strip(x)));
  for(const m of strip(q.e).matchAll(/「([^」]{4,60})」が誤りの理由/g)){
    const core=norm(m[1]);
    const hit=wrongs.some(w=>{const ws=new Set(w);let n=0;for(const c of core)if(ws.has(c))n++;return n/core.length>=0.75;});
    if(!hit)orphan.push(q.id+'「'+m[1]+'」');
  }
}
// NG ではなく WARN として出す（下のレポートで分岐）

// 7. 解説内の Section 参照が実在するか
const secNums=new Set(SYL.flatMap(c=>c.s.map(x=>x[0])));
const badSec=[];
for(const q of QB)for(const m of strip(q.e).matchAll(/Section\s*(\d+)/g))if(!secNums.has(+m[1]))badSec.push(q.id+':Sec'+m[1]);
add('解説が存在しないSectionを参照',badSec);

// 8. sec と ch の対応がシラバスと一致するか
const chOf={};SYL.forEach((c,i)=>c.s.forEach(x=>chOf[x[0]]=i+1));
add('secに対するchが不一致',QB.filter(q=>chOf[q.sec]&&chOf[q.sec]!==q.ch).map(q=>q.id+':sec'+q.sec+'=ch'+q.ch+'(正:ch'+chOf[q.sec]+')'));

// 9. 用語が教材本文に完全一致で出現するか（linkify は本文のみ対象）
add('用語集にあるが教材本文に無い語',Object.keys(GLO).filter(k=>!plain.includes(k)));

// 10. LESSONS 参照
const miss=[];LESSONS.forEach(l=>[...(l.qids||[]),...(l.caseIds||[])].forEach(id=>{if(!QB.some(q=>q.id===id))miss.push('L'+l.n+':'+id);}));
add('LESSONSが存在しない問題を参照',miss);
add('caseIdsにケース(cs)を持たない問題',LESSONS.flatMap(l=>(l.caseIds||[]).filter(id=>{const q=QB.find(x=>x.id===id);return q&&!q.cs;}).map(id=>'L'+l.n+':'+id)));

// 11. 模試の整合
const mockAll=MOCKSETS.flatMap(m=>m.ids);
add('模試が存在しない問題を参照',mockAll.filter(id=>!QB.some(q=>q.id===id)));
add('模試セット間の重複',mockAll.filter((x,i)=>mockAll.indexOf(x)!==i));
add('模試の問題数が定義nと不一致',MOCKSETS.filter(m=>m.ids.length!==m.n).map(m=>m.id+':'+m.ids.length+'/'+m.n));
add("pool が both/mock 以外",QB.filter(q=>!['both','mock'].includes(q.pool)).map(q=>q.id+':'+q.pool));

// 12. 公式テキストとの用語突き合わせ（WARN・裁定は②本体レビュー）
let warnTerms=[];
try{const T=fs.readFileSync('text_ocr/AICX_official_text.md','utf8');
  warnTerms=Object.keys(GLO).filter(k=>!T.includes(k));}catch(e){}

// レポート
console.log('QB '+QB.length+'問 / 用語 '+Object.keys(GLO).length+'語 / 模試 '+MOCKSETS.map(m=>m.ids.length).join('+')+'問');
console.log('単独最長 '+sole+'/'+QB.length+' = '+(sole/QB.length*100).toFixed(0)+'% (閾値70%未満)\n');
let ng=0;
for(const {k,n,items} of out){
  if(n===0){console.log('  OK  '+k);continue;}
  ng++;console.log('  NG  '+k+': '+n+'件');
  items.slice(0,12).forEach(x=>console.log('        - '+x));
  if(n>12)console.log('        ... 他'+(n-12)+'件');
}
if(orphan.length){
  console.log('\n  WARN 解説の引用と誤答肢の対応が弱い箇所: '+orphan.length+'件（要約引用のため誤検知を含む）');
  orphan.forEach(x=>console.log('        - '+x));
  console.log('        ※2026-08-30 に全件目視で誤検知と裁定済み。編集後は前回との差分だけ見る');
}
if(warnTerms.length){
  console.log('\n  WARN 用語集にあるが公式テキストに同表記で出現しない語: '+warnTerms.length+'語');
  console.log('        '+warnTerms.join(' / '));
  console.log('        ※表記違いか公式に無い概念かは機械で判定できない。②本体レビューで裁定する');
}
console.log('\n'+(ng===0?'機械検出項目はすべてクリア':'要対応 '+ng+'項目'));
