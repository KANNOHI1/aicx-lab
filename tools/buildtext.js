/* 公式テキストの書き起こし（text_ocr/AICX_official_text.md）を、スマホで読める単一 HTML に変換する。
   出力は text_ocr/ 配下（.gitignore 済み＝公開リポジトリには入らない）。私的複製の範囲で使う。 */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'text_ocr', 'AICX_official_text.md');
const OUT = path.join(ROOT, 'text_ocr', 'AICX_official_text.html');
const lines = fs.readFileSync(SRC, 'utf8').split(/\r?\n/);

/* 第6章は Section 名でなくステップ名が見出しになっている（公式の構成）。番号へ対応づける */
const STEP = { '発見・選定': 28, '定義・構造化': 29, '設計・プロンプト': 30, '開発・検証': 31, '展開・定着': 32 };
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/* 太字とコードだけ通す。原文に生の HTML は無い */
const inline = s => esc(s).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>');

const toc = [], out = [];
let page = '', tbl = null, inCode = false, li = null;

const closeTbl = () => { if (tbl) { out.push(tbl.join('') + '</table></div>'); tbl = null; } };
const closeLi = () => { if (li) { out.push(li.join('') + '</ul>'); li = null; } };
const close = () => { closeTbl(); closeLi(); };

for (const L of lines) {
  if (/^```/.test(L)) { close(); inCode = !inCode; out.push(inCode ? '<pre><code>' : '</code></pre>'); continue; }
  if (inCode) { out.push(esc(L)); continue; }

  const pm = L.match(/^<!--\s*p(\d+)/);                       // 原本のページ番号
  if (pm) { page = pm[1]; continue; }
  if (/^-{3,}$/.test(L) || !L.trim()) { close(); continue; }

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
    if (/^CHAPTER/i.test(text)) continue;                      // 章の柱（Section の途中に挟まるため出さない）
    const lv = Math.min(depth + 1, 5);
    out.push('<h' + lv + ' class="h">' + inline(text) + '</h' + lv + '>');
    continue;
  }

  if (/^\[図:/.test(L)) {
    close();
    out.push('<div class="fig">' + inline(L.replace(/^\[図:\s*/, '図｜').replace(/\]$/, '')) + '</div>');
    continue;
  }
  if (/^>?\s*POINT\s*$/.test(L)) { close(); out.push('<div class="pt">POINT</div>'); continue; }
  if (/^>\s?/.test(L)) { close(); out.push('<blockquote>' + inline(L.replace(/^>\s?/, '')) + '</blockquote>'); continue; }

  if (/^\|/.test(L)) {                                          // 表
    closeLi();
    const cells = L.split('|').slice(1, -1).map(c => c.trim());
    if (cells.every(c => /^:?-{2,}:?$/.test(c))) continue;       // 区切り行
    if (!tbl) { tbl = ['<div class="tw"><table>', '<tr>' + cells.map(c => '<th>' + inline(c) + '</th>').join('') + '</tr>']; }
    else tbl.push('<tr>' + cells.map(c => '<td>' + inline(c) + '</td>').join('') + '</tr>');
    continue;
  }
  closeTbl();

  /* リスト記号は後ろに空白があるものだけ。`**問3**` の太字を記号と誤認しないため */
  const lm = L.match(/^\s*(?:[-・]\s+|\*\s+|\d+[.、　]\s*)(.+)$/);
  if (lm) { if (!li) li = ['<ul>']; li.push('<li>' + inline(lm[1]) + '</li>'); continue; }
  closeLi();

  out.push('<p>' + inline(L) + '</p>');
}
close();

const tocHTML = toc.map(t => '<a href="#' + t.id + '"><b>' + t.n + '</b> ' + esc(t.title) + '</a>').join('');

const CSS = [
  ':root{--bg:#fbfaf8;--fg:#22201d;--dim:#7a746c;--line:#e4e0da;--card:#fff;--accent:#8a5a2b;--mark:#ffe08a}',
  '@media(prefers-color-scheme:dark){:root{--bg:#16181c;--fg:#e6e3de;--dim:#948d84;--line:#2c3038;--card:#1c1f24;--accent:#d9a05b;--mark:#6b5520}}',
  '*{box-sizing:border-box}',
  'body{margin:0;background:var(--bg);color:var(--fg);font-family:-apple-system,"Hiragino Sans","Noto Sans JP",sans-serif;line-height:1.9;font-size:var(--fs,17px);-webkit-text-size-adjust:100%}',
  '#bar{position:sticky;top:0;z-index:20;display:flex;gap:6px;align-items:center;padding:8px 10px;padding-top:calc(8px + env(safe-area-inset-top));background:var(--card);border-bottom:1px solid var(--line)}',
  '#bar button{border:1px solid var(--line);background:transparent;color:var(--fg);border-radius:8px;padding:7px 10px;font-size:15px;flex:none}',
  '#q{flex:1;min-width:0;border:1px solid var(--line);background:var(--bg);color:var(--fg);border-radius:8px;padding:8px 10px;font-size:16px}',
  '#hits{font-size:12px;color:var(--dim);white-space:nowrap;flex:none}',
  '#toc{position:fixed;inset:0;z-index:30;background:var(--bg);overflow:auto;display:none;padding:10px 12px calc(24px + env(safe-area-inset-bottom))}',
  '#toc.on{display:block}',
  '#toc a{display:block;padding:11px 8px;border-bottom:1px solid var(--line);color:var(--fg);text-decoration:none}',
  '#toc a b{display:inline-block;min-width:2.2em;color:var(--accent)}',
  'main{padding:0 14px calc(60px + env(safe-area-inset-bottom));max-width:760px;margin:0 auto}',
  'h2.sec{margin:34px 0 12px;padding-top:10px;border-top:2px solid var(--accent);font-size:1.25em;line-height:1.5}',
  '.secn{display:block;font-size:.62em;color:var(--accent);letter-spacing:.08em}',
  '.pg{float:right;font-size:.55em;color:var(--dim);font-weight:400}',
  '.h{margin:22px 0 8px;font-size:1.03em}',
  'p{margin:.75em 0}',
  'ul{margin:.6em 0;padding-left:1.3em}',
  'blockquote{margin:.7em 0;padding:.5em .8em;border-left:3px solid var(--accent);background:var(--card)}',
  '.pt{display:inline-block;margin:14px 0 2px;padding:2px 10px;border-radius:99px;background:var(--accent);color:var(--card);font-size:.72em;letter-spacing:.1em}',
  '.fig{margin:.8em 0;padding:.7em .9em;border:1px dashed var(--line);border-radius:8px;background:var(--card);font-size:.9em;color:var(--dim)}',
  '.tw{overflow-x:auto;margin:.8em 0}',
  'table{border-collapse:collapse;min-width:100%;font-size:.88em}',
  'th,td{border:1px solid var(--line);padding:6px 9px;text-align:left;vertical-align:top}',
  'th{background:var(--card)}',
  'pre{overflow-x:auto;background:var(--card);border:1px solid var(--line);border-radius:8px;padding:10px;font-size:.85em;white-space:pre-wrap}',
  'mark{background:var(--mark);color:inherit}',
  'mark.cur{outline:2px solid var(--accent)}'
].join('\n');

const JS = [
  'var $=function(s){return document.querySelector(s)},doc=$("#doc");',
  '$("#btoc").onclick=function(){$("#toc").classList.toggle("on")};',
  '$("#toc").onclick=function(e){if(e.target.closest("a"))$("#toc").classList.remove("on")};',
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

const html = '<!doctype html><html lang="ja"><head>' +
  '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' +
  '<title>AICX 公式テキスト（私的閲覧用）</title><style>' + CSS + '</style></head><body>' +
  '<div id="bar"><button id="btoc">☰</button>' +
  '<input id="q" type="search" placeholder="全文検索" enterkeyhint="search">' +
  '<span id="hits"></span><button id="prev">‹</button><button id="next">›</button><button id="fs">Aa</button></div>' +
  '<div id="toc">' + tocHTML + '</div>' +
  '<main id="doc">' + out.join('\n') + '</main>' +
  '<script>' + JS + '</script></body></html>';

fs.writeFileSync(OUT, html);
console.log('生成:', OUT);
console.log('Section 見出し ' + toc.length + ' 件 / ' + (fs.statSync(OUT).size / 1024 / 1024).toFixed(2) + ' MB');
