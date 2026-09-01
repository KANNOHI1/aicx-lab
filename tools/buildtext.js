/* 公式テキストの書き起こし（text_ocr/AICX_official_text.md）を、スマホで読める単一 HTML に変換する。
   出力は text_ocr/ 配下（.gitignore 済み＝公開リポジトリには入らない）。私的複製の範囲で使う。 */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'text_ocr', 'AICX_official_text.md');
const OUT = path.join(ROOT, 'text_ocr', 'AICX_official_text.html');
const OUT_ART = path.join(ROOT, 'text_ocr', 'AICX_official_text.artifact.html');
const lines = fs.readFileSync(SRC, 'utf8').split(/\r?\n/);

/* 第6章は Section 名でなくステップ名が見出しになっている（公式の構成）。番号へ対応づける */
const STEP = { '発見・選定': 28, '定義・構造化': 29, '設計・プロンプト': 30, '開発・検証': 31, '展開・定着': 32 };
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/* 太字とコードだけ通す。原文に生の HTML は無い */
const inline = s => esc(s).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>');

const NL = String.fromCharCode(10);
const toc = [], out = [];
let page = '', tbl = null, inCode = false, li = null, fig = null, callout = null;

const closeTbl = () => { if (tbl) { out.push(tbl.join('') + '</table></div>'); tbl = null; } };
const closeLi = () => { if (li) { out.push(li.join('') + '</ul>'); li = null; } };
/* 図は説明の箇条書きを伴う。原文で直後に続くものは同じ枠へ入れる */
const closeFig = () => { if (fig) { out.push(fig.join('') + '</div>'); fig = null; } };

/* 原文の囲みは「目印の行 + 次の1段落」で1つの箱になる。
   正解だけは details にして畳む（開くまで自分で解ける） */
const CAL = { 'POINT': 'cpt', '学習のポイント': 'clp' };
const emitCal = body => {
  const c = callout; callout = null;
  if (c === '正解') out.push('<details class="ans"><summary>正解と解説</summary><div>' + body + '</div></details>');
  else out.push('<div class="cal ' + CAL[c] + '"><span class="cl">' + c + '</span>' + body + '</div>');
};
/* 目印の直後が段落でなかった場合（見出し・表・図が続く）は、目印だけ残す */
const flushCal = () => {
  if (!callout) return;
  const c = callout; callout = null;
  out.push(c === '正解' ? '<h4 class="qz">正解</h4>'
    : '<div class="cal ' + CAL[c] + '"><span class="cl">' + c + '</span></div>');
};
const close = () => { closeTbl(); closeLi(); closeFig(); };

for (const L of lines) {
  if (/^```/.test(L)) { close(); inCode = !inCode; out.push(inCode ? '<pre><code>' : '</code></pre>'); continue; }
  if (inCode) { out.push(esc(L)); continue; }

  const pm = L.match(/^<!--\s*p(\d+)/);                       // 原本のページ番号
  if (pm) { page = pm[1]; continue; }
  if (/^-{3,}$/.test(L) || !L.trim()) { close(); continue; }
  if (/^CHAPTER\s*\d*\s*$/i.test(L)) continue;                // 版面の柱。Section 見出しと重なるので出さない

  const hm = L.match(/^(#{1,4})\s*(.+?)\s*$/);
  if (hm) {
    close();
    const depth = hm[1].length, text = hm[2];
    const sm = text.match(/^Section\s*(\d+)\.?\s*(.*)$/);
    const step = STEP[text];
    if (sm || step) {                                          // 目次に載せる粒度＝Section
      const n = sm ? Number(sm[1]) : step;
      const title = sm ? (sm[2] || '') : text;
      toc.push({ id: 'sec' + n, n, title, page });
      out.push('<h2 id="sec' + n + '" class="sec"><span class="pg">p' + page + '</span>' +
        '<span class="secn">Section ' + n + '</span>' + esc(title) + '</h2>');
      continue;
    }
    if (/^正解$/.test(text)) { flushCal(); callout = '正解'; continue; }   // 「### 正解」も囲みと同じ扱い
    flushCal();
    if (/^CHAPTER/i.test(text)) continue;                      // 章の柱（Section の途中に挟まるため出さない）
    const band = text.match(/^(\d)[\s　.]*(.+)$/);             // 「1 知識」「3 理解度チェック」＝Section 共通の骨格
    if (band) { out.push('<h3 class="band"><span class="bn">' + esc(band[1]) + '</span>' + inline(band[2]) + '</h3>'); continue; }
    if (/^問\s*\d/.test(text)) { out.push('<h4 class="qz">' + inline(text) + '</h4>'); continue; }
    const lv = Math.min(depth + 1, 5);
    out.push('<h' + lv + ' class="h">' + inline(text) + '</h' + lv + '>');
    continue;
  }

  if (/^\[図:/.test(L)) {
    close(); flushCal();
    fig = ['<div class="fig"><div class="fgt">' + inline(L.replace(/^\[図:\s*/, '').replace(/\]$/, '')) + '</div>'];
    continue;
  }
  /* 原文の囲みの目印。太字のものと素のもの・引用記号つきが混在する（OCR 由来） */
  const km = L.match(/^>?\s*(?:\*\*)?(POINT|学習のポイント|正解)(?:\*\*)?\s*$/);
  if (km) { close(); flushCal(); callout = km[1]; continue; }
  if (/^>\s?/.test(L)) { close(); flushCal(); out.push('<blockquote>' + inline(L.replace(/^>\s?/, '')) + '</blockquote>'); continue; }

  if (/^\|/.test(L)) {                                          // 表
    closeLi(); flushCal();
    const cells = L.split('|').slice(1, -1).map(c => c.trim());
    if (cells.every(c => /^:?-{2,}:?$/.test(c))) continue;       // 区切り行
    if (!tbl) { tbl = ['<div class="tw"><table>', '<tr>' + cells.map(c => '<th>' + inline(c) + '</th>').join('') + '</tr>']; }
    else tbl.push('<tr>' + cells.map(c => '<td>' + inline(c) + '</td>').join('') + '</tr>');
    continue;
  }
  closeTbl();

  /* リスト記号は後ろに空白があるものだけ。`**問3**` の太字を記号と誤認しないため */
  const lm = L.match(/^\s*(?:[-・]\s+|\*\s+|\d+[.、　]\s*)(.+)$/);
  if (lm) {
    if (fig) { fig.push('<div class="fl">' + inline(lm[1]) + '</div>'); continue; }
    if (!li) li = ['<ul>']; li.push('<li>' + inline(lm[1]) + '</li>'); continue;
  }
  closeLi();
  closeFig();

  /* 理解度チェックの答えは畳む。開くまで自分で解ける（details は JS 不要） */
  const am = L.match(/^\*\*正解\*\*\s*[:：]\s*(.+)$/);
  if (am) { flushCal(); out.push('<details class="ans"><summary>正解と解説</summary><div>' + inline(am[1]) + '</div></details>'); continue; }

  /* 太字だけの行は本文でなく構造の目印。原文の囲み（POINT・学習のポイント）を枠として復元する */
  const bm = L.match(/^\*\*(.+?)\*\*$/);
  if (bm) {
    flushCal();
    const t = bm[1].trim();
    const band = t.match(/^(\d)[\s　.]*(.+)$/);
    if (band) { out.push('<h3 class="band"><span class="bn">' + esc(band[1]) + '</span>' + inline(band[2]) + '</h3>'); continue; }
    if (/^問\s*\d/.test(t)) { out.push('<h4 class="qz">' + inline(t) + '</h4>'); continue; }
    out.push('<h4 class="h">' + inline(t) + '</h4>');
    continue;
  }
  if (callout) { emitCal(inline(L)); continue; }

  out.push('<p>' + inline(L) + '</p>');
}
close();
flushCal();

const tocHTML = toc.map(t => '<a href="#' + t.id + '"><b>' + t.n + '</b> ' + esc(t.title) + '</a>').join('');

/* 明暗はトークンだけを差し替える。単体ファイルと Artifact で包み方が違うので分けておく */
const T_LIGHT = '--bg:#fbfaf8;--fg:#22201d;--dim:#7a746c;--line:#e4e0da;--card:#fff;--accent:#8a5a2b;--mark:#ffe08a;'
  + '--bold:#7a3f10;--boldbg:rgba(138,90,43,.11);--ptbg:#fff6e6;--lpbg:#eef3f7;--lpline:#3d6b8f';
const T_DARK = '--bg:#16181c;--fg:#e6e3de;--dim:#948d84;--line:#2c3038;--card:#1c1f24;--accent:#d9a05b;--mark:#6b5520;'
  + '--bold:#f0c07a;--boldbg:rgba(217,160,91,.14);--ptbg:#241d12;--lpbg:#15202a;--lpline:#5b93bf';

const RULES = [
  '*{box-sizing:border-box}',
  'body{margin:0;background:var(--bg);color:var(--fg);font-family:-apple-system,"Hiragino Sans","Noto Sans JP",sans-serif;line-height:1.92;font-size:var(--fs,17px);-webkit-text-size-adjust:100%}',
  '#bar{position:sticky;top:0;z-index:20;display:flex;gap:6px;align-items:center;padding:8px 10px;padding-top:calc(8px + env(safe-area-inset-top));background:var(--card);border-bottom:1px solid var(--line)}',
  '#bar button,#bar .lk{border:1px solid var(--line);background:transparent;color:var(--fg);border-radius:8px;padding:7px 10px;font-size:15px;flex:none;text-decoration:none;line-height:1}',
  '#q{flex:1;min-width:0;border:1px solid var(--line);background:var(--bg);color:var(--fg);border-radius:8px;padding:8px 10px;font-size:16px}',
  '#hits{font-size:12px;color:var(--dim);white-space:nowrap;flex:none}',
  /* 目次は details。JS が動かないビューア（ドライブ内蔵など）でも開ける */
  '.pad{padding:0 16px;max-width:760px;margin:0 auto}',
  '#toc{margin:12px 0 6px;border:1px solid var(--line);border-radius:10px;background:var(--card);overflow:hidden;scroll-margin-top:60px}',
  '#toc>summary{padding:12px 14px;font-weight:700;cursor:pointer;list-style:none}',
  '#toc>summary::-webkit-details-marker{display:none}',
  '#toc>summary::after{content:"▾";float:right;color:var(--accent)}',
  '#toc[open]>summary{border-bottom:1px solid var(--line)}',
  '#toc[open]>summary::after{content:"▴"}',
  '#toc a{display:block;padding:11px 14px;border-top:1px solid var(--line);color:var(--fg);text-decoration:none}',
  '#toc a b{display:inline-block;min-width:2.4em;color:var(--accent)}',
  'main{padding:0 16px calc(60px + env(safe-area-inset-bottom));max-width:760px;margin:0 auto}',
  /* 見出しの段階を明確に分ける。拾い読みの足場になる */
  'h2.sec{margin:40px 0 14px;padding-top:12px;border-top:3px solid var(--accent);font-size:1.32em;line-height:1.45;scroll-margin-top:56px}',
  '.secn{display:block;font-size:.6em;color:var(--accent);letter-spacing:.1em;font-weight:700}',
  '.pg{float:right;font-size:.52em;color:var(--dim);font-weight:400}',
  '.h{margin:26px 0 8px;font-size:1.06em;line-height:1.55;padding-left:.6em;border-left:3px solid var(--line)}',
  /* Section 共通の骨格（1 知識 / 2 … / 3 理解度チェック） */
  '.band{margin:32px 0 12px;padding:8px 12px;border-radius:8px;background:var(--boldbg);font-size:1.02em;display:flex;gap:.6em;align-items:baseline}',
  '.band .bn{flex:none;width:1.7em;height:1.7em;border-radius:50%;background:var(--accent);color:#fff;font-size:.8em;display:inline-flex;align-items:center;justify-content:center}',
  '.qz{margin:24px 0 8px;font-size:1.02em;color:var(--accent)}',
  'p{margin:.8em 0}',
  'b{color:var(--bold);font-weight:700}',
  'ul{margin:.6em 0;padding-left:1.3em}',
  'li{margin:.3em 0}',
  'blockquote{margin:.7em 0;padding:.5em .8em;border-left:3px solid var(--accent);background:var(--card)}',
  /* 原文の囲み。POINT＝試験で問われる要点、学習のポイント＝Section の狙い */
  '.cal{position:relative;margin:18px 0;padding:34px 14px 14px;border-radius:10px;border:1px solid var(--line)}',
  '.cal .cl{position:absolute;top:10px;left:12px;font-size:.68em;font-weight:700;letter-spacing:.12em}',
  '.cpt{background:var(--ptbg);border-color:var(--accent)}',
  '.cpt .cl{color:var(--accent)}',
  '.clp{background:var(--lpbg);border-color:var(--lpline)}',
  '.clp .cl{color:var(--lpline)}',
  /* 理解度チェックの答えは畳んでおく。開くまで自分で解ける */
  '.ans{margin:10px 0 22px;border:1px solid var(--line);border-radius:8px;background:var(--card)}',
  '.ans>summary{padding:10px 14px;cursor:pointer;color:var(--accent);font-weight:700;font-size:.92em;list-style:none}',
  '.ans>summary::-webkit-details-marker{display:none}',
  '.ans>summary::before{content:"▸ ";}',
  '.ans[open]>summary{border-bottom:1px solid var(--line)}',
  '.ans[open]>summary::before{content:"▾ ";}',
  '.ans>div{padding:10px 14px;font-size:.95em}',
  '.fig{margin:1em 0;padding:.8em 1em;border:1px dashed var(--line);border-radius:8px;background:var(--card);font-size:.9em}',
  '.fgt{color:var(--accent);font-weight:700;font-size:.92em;margin-bottom:.2em}',
  '.fgt::before{content:"図｜"}',
  '.fl{color:var(--dim);padding-left:.9em;text-indent:-.9em;margin:.25em 0}',
  '.fl::before{content:"– "}',
  '.tw{overflow-x:auto;margin:1em 0;-webkit-overflow-scrolling:touch}',
  'table{border-collapse:collapse;min-width:100%;font-size:.88em}',
  'th,td{border:1px solid var(--line);padding:7px 10px;text-align:left;vertical-align:top}',
  'th{background:var(--boldbg);font-weight:700;white-space:nowrap}',
  'pre{overflow-x:auto;background:var(--card);border:1px solid var(--line);border-radius:8px;padding:10px;font-size:.85em;white-space:pre-wrap}',
  'mark{background:var(--mark);color:inherit}',
  'mark.cur{outline:2px solid var(--accent)}'
].join('\n');

/* 単体ファイル: OS の設定だけを見る */
const CSS = ':root{' + T_LIGHT + '}\n@media(prefers-color-scheme:dark){:root{' + T_DARK + '}}\n' + RULES;
/* Artifact: 閲覧側のテーマ切替が data-theme を立てるため、3状態すべてを書く */
const CSS_ART = ':root{' + T_LIGHT + '}\n'
  + '@media(prefers-color-scheme:dark){:root:not([data-theme="light"]){' + T_DARK + '}}\n'
  + ':root[data-theme="dark"]{' + T_DARK + '}\n' + RULES;

const JS = [
  'var $=function(s){return document.querySelector(s)},doc=$("#doc");',
  '/* 目次は details なので開閉は JS 不要。行を選んだら閉じるところだけ補助する */',
  '$("#toc").onclick=function(e){if(e.target.closest("a"))setTimeout(function(){$("#toc").open=false},0)};',
  '/* 文字サイズ：4段階で循環し保存する */',
  'var SIZES=[15,17,19,22],si=+(localStorage.getItem("aicx-txt-fs")||1);',
  'function applyFs(){document.body.style.setProperty("--fs",SIZES[si]+"px")}applyFs();',
  '$("#fs").onclick=function(){si=(si+1)%SIZES.length;localStorage.setItem("aicx-txt-fs",si);applyFs()};',
  '/* 全文検索：本文を作り替えず、該当するテキストノードだけ mark で包む */',
  'var hits=[],hi=-1;',
  'function clearHits(){var ms=doc.querySelectorAll("mark");for(var i=0;i<ms.length;i++){ms[i].replaceWith(document.createTextNode(ms[i].textContent))}doc.normalize();hits=[];hi=-1;$("#hits").textContent=""}',
  'function search(w){clearHits();if(w.length<2)return;',
  ' var walk=document.createTreeWalker(doc,NodeFilter.SHOW_TEXT),targets=[],n;',
  ' while(n=walk.nextNode()){if(n.nodeValue.toLowerCase().indexOf(w.toLowerCase())>=0)targets.push(n)}',
  ' var re=new RegExp("("+w.replace(/[.*+?^${}()|[\\]\\\\]/g,"\\\\$&")+")","ig");',
  ' for(var i=0;i<targets.length;i++){var parts=targets[i].nodeValue.split(re),f=document.createDocumentFragment();',
  '  for(var k=0;k<parts.length;k++){if(k%2){var m=document.createElement("mark");m.textContent=parts[k];f.appendChild(m);hits.push(m)}',
  '   else if(parts[k])f.appendChild(document.createTextNode(parts[k]))}',
  '  targets[i].replaceWith(f)}',
  ' $("#hits").textContent=hits.length?"1/"+hits.length:"0件";if(hits.length)go(0)}',
  'function go(k){if(!hits.length)return;for(var i=0;i<hits.length;i++)hits[i].classList.remove("cur");',
  ' hi=(k+hits.length)%hits.length;hits[hi].classList.add("cur");hits[hi].scrollIntoView({block:"center"});',
  ' $("#hits").textContent=(hi+1)+"/"+hits.length}',
  'var t;$("#q").oninput=function(e){clearTimeout(t);var v=e.target.value.trim();t=setTimeout(function(){search(v)},250)};',
  '$("#next").onclick=function(){go(hi+1)};$("#prev").onclick=function(){go(hi-1)};',
  '/* 読み位置を覚えて次回そこから開く */',
  'var secs=[].slice.call(document.querySelectorAll("h2.sec"));',
  'addEventListener("scroll",function(){clearTimeout(window._s);window._s=setTimeout(function(){',
  ' var y=scrollY+120,cur=secs[0];for(var i=0;i<secs.length;i++){if(secs[i].offsetTop<=y)cur=secs[i]}',
  ' if(cur)localStorage.setItem("aicx-txt-pos",cur.id)},400)},{passive:true});',
  'if(!location.hash){var id=localStorage.getItem("aicx-txt-pos"),el=id&&document.getElementById(id);if(el)el.scrollIntoView()}'
].join('\n');

/* 中身は単体ファイルと Artifact で共通。包み方だけが違う */
const BODY = '<div id="bar"><a class="lk" href="#toc">☰</a>' +
  '<input id="q" type="search" placeholder="全文検索" enterkeyhint="search">' +
  '<span id="hits"></span><button id="prev">‹</button><button id="next">›</button><button id="fs">Aa</button></div>' +
  '<div class="pad"><details id="toc"><summary>目次（全' + toc.length + 'Section）</summary>' + tocHTML + '</details></div>' +
  '<main id="doc">' + out.join(NL) + '</main>' +
  '<script>' + JS + '</script>';

const html = '<!doctype html><html lang="ja"><head>' +
  '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' +
  '<title>AICX 公式テキスト（私的閲覧用）</title><style>' + CSS + '</style></head><body>' + BODY + '</body></html>';

/* Artifact は doctype/html/head/body を公開時に自分で被せる。title と style だけ先頭に置く */
const artifact = '<title>AICX 公式テキスト</title>' +
  '<style>' + CSS_ART + '</style>' + BODY;

fs.writeFileSync(OUT_ART, artifact);

fs.writeFileSync(OUT, html);
console.log('生成:', OUT);
console.log('Section 見出し ' + toc.length + ' 件 / ' + (fs.statSync(OUT).size / 1024 / 1024).toFixed(2) + ' MB');
console.log('Artifact 用:', OUT_ART);
