// 作問品質チェック（memory: project_aicx_lab_question_quality）
const fs=require('fs');
const h=fs.readFileSync('index.html','utf8');
const m=h.match(/const QB=\[[\s\S]*?\n\];/);
const QB=eval('('+m[0].replace(/^const QB=/,'').replace(/;$/,'')+')');
const targets=process.argv.slice(2);
const list=targets.length?QB.filter(q=>targets.includes(q.id)):QB;
let sole=0,strong=[],t3=[],bad=[];
for(const q of list){
  const L=q.o.map(x=>x.length), a=L[q.a];
  const sorted=[...L].sort((x,y)=>y-x);
  if(a===sorted[0] && sorted[0]>sorted[1]) sole++;
  if(a===sorted[0] && sorted[0]>sorted[1] && a>=sorted[1]*1.25) strong.push(q.id+` (${a} vs ${sorted[1]})`);
  if(q.type===3 && !/最も優先|最初に|最優先|真っ先|順序/.test(q.q)) t3.push(q.id);
  if(q.o.length!==4) bad.push(q.id+' 選択肢数'+q.o.length);
  if(q.cs){const n=q.cs.replace(/\n/g,'').length; if(n<120||n>250) bad.push(q.id+' ケース字数'+n); if(q.limit!==180) bad.push(q.id+' limit'+q.limit);}
}
const ids=QB.map(q=>q.id);
console.log(`対象 ${list.length}問 / QB総数 ${QB.length} / ID重複 ${ids.length-new Set(ids).size}`);
console.log(`単独最長 ${sole}/${list.length} = ${(sole/list.length*100).toFixed(0)}%`);
console.log(`強い手がかり(25%超) ${strong.length}件`, strong.join(', '));
console.log(`型3の順位語欠落 ${t3.length}件`, t3.join(', '));
console.log(`その他違反 ${bad.length}件`, bad.join(', '));
