// Report export (HTML / CSV / TXT). Uses state and helpers defined in app.js.
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const stamp = () => {
  const d = new Date(), p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
};
function download(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
const pairs = () => [...new Set(entries.map((e) => `${e.s} → ${e.d}`))].join(', ');
const sourceName = () => (inputSel.value === 'system' ? T().srcSys : T().srcMic);

function reportHtml() {
  const t = T(), now = new Date().toISOString(), year = new Date().getFullYear();
  const rows = entries.map((e, i) => `<tr><td class="n">${i + 1}</td><td class="tm">${esc(fmtDateTime(e.at))}</td>`
    + `<td><span class="code">${esc(e.s)}</span>${esc(e.o)}</td><td><span class="code a">${esc(e.d)}</span>${esc(e.t)}</td></tr>`).join('');
  return `<!doctype html><html lang="${ui}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(t.rTitle)} ${stamp()}</title><style>
body{margin:0;background:#f3f4fa;color:#141726;font:14px/1.6 "Be Vietnam Pro","Noto Sans JP","Segoe UI",system-ui,sans-serif}
.page{max-width:900px;margin:24px auto;background:#fff;border-radius:18px;padding:32px 36px;box-shadow:0 10px 30px -12px rgba(30,35,90,.2)}
header{display:flex;align-items:center;gap:16px;border-bottom:2px solid #eef0f8;padding-bottom:18px}
header img{width:56px;height:56px;border-radius:50%;object-fit:cover}
h1{margin:0;font-size:22px}.sub{margin:2px 0 0;color:#6a7088}
.meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin:18px 0}
.meta div{background:#f6f7fb;border-radius:12px;padding:10px 14px}.meta b{display:block;font-size:11px;color:#6a7088;text-transform:uppercase;letter-spacing:.05em}
table{width:100%;border-collapse:collapse}th{background:#5b5cf0;color:#fff;text-align:left;padding:9px 10px;font-size:12px}
th:first-child{border-radius:10px 0 0 0}th:last-child{border-radius:0 10px 0 0}
td{padding:9px 10px;border-bottom:1px solid #eef0f8;vertical-align:top}tr:nth-child(even) td{background:#fafbfe}
.n{color:#6a7088;width:36px}.tm{white-space:nowrap;color:#6a7088;width:150px}
.code{display:inline-block;font-size:10px;font-weight:700;background:#eef0f8;color:#6a7088;border-radius:5px;padding:0 6px;margin-right:6px}.code.a{background:#ecebff;color:#5b5cf0}
footer{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:24px;color:#6a7088;font-size:12px}
footer img{width:22px;height:22px;border-radius:50%;object-fit:cover}
.print{position:fixed;right:20px;bottom:20px;border:0;border-radius:99px;padding:12px 20px;color:#fff;font:600 14px inherit;background:linear-gradient(135deg,#5b5cf0,#a855f7);cursor:pointer}
@media print{body{background:#fff}.page{box-shadow:none;margin:0;max-width:none;padding:0}.print{display:none}th{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body><div class="page">
<header><img src="${LOGO}" alt=""><div><h1>${esc(t.rTitle)}</h1><p class="sub">${esc(t.title)} · ${esc(AUTHOR)}</p></div></header>
<section class="meta"><div><b>${esc(t.rCreated)}</b>${esc(fmtDateTime(now))}</div><div><b>${esc(t.rPair)}</b>${esc(pairs())}</div>
<div><b>${esc(t.rSource)}</b>${esc(sourceName())}</div><div><b>${esc(t.rCount)}</b>${entries.length}</div></section>
<table><thead><tr><th>${esc(t.rNo)}</th><th>${esc(t.rTime)}</th><th>${esc(t.rOrig)}</th><th>${esc(t.rTrans)}</th></tr></thead><tbody>${rows}</tbody></table>
<footer><img src="${LOGO}" alt=""><span>${esc(t.credit(year, AUTHOR))}</span></footer>
</div><button class="print" onclick="print()">${esc(t.rPrint)}</button></body></html>`;
}

function reportCsv() {
  const t = T(), q = (s) => `"${String(s).replace(/"/g, '""')}"`;
  const lines = [[t.rNo, t.rTime, `${t.rOrig}`, `${t.rTrans}`, 'From', 'To'].map(q).join(',')];
  entries.forEach((e, i) => lines.push([i + 1, fmtDateTime(e.at), e.o, e.t, e.s, e.d].map(q).join(',')));
  lines.push('', q(t.credit(new Date().getFullYear(), AUTHOR)));
  return '﻿' + lines.join('\r\n'); // BOM so Excel opens UTF-8 (Japanese / Vietnamese) correctly
}

function reportTxt() {
  const t = T();
  const head = [t.rTitle, `${t.rCreated}: ${fmtDateTime(new Date().toISOString())}`, `${t.rPair}: ${pairs()}`, `${t.rCount}: ${entries.length}`, ''.padEnd(40, '=')];
  const body = entries.map((e, i) => `${i + 1}. [${fmtDateTime(e.at)}]\n   ${e.s}: ${e.o}\n   ${e.d}: ${e.t}`);
  return [...head, ...body, '', t.credit(new Date().getFullYear(), AUTHOR)].join('\r\n');
}

document.querySelectorAll('#export .menu button').forEach((b) => b.onclick = () => {
  $('export').open = false;
  if (!entries.length) { setStatus('noData'); return; }
  const base = `live-translate-report-${stamp()}`;
  if (b.dataset.fmt === 'html') download(`${base}.html`, reportHtml(), 'text/html;charset=utf-8');
  if (b.dataset.fmt === 'csv') download(`${base}.csv`, reportCsv(), 'text/csv;charset=utf-8');
  if (b.dataset.fmt === 'txt') download(`${base}.txt`, reportTxt(), 'text/plain;charset=utf-8');
  setStatus('exported');
});
document.addEventListener('click', (e) => { if (!e.target.closest('#export')) $('export').open = false; });
