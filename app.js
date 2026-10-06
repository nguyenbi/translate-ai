// Live Translate: microphone / system audio -> speech recognition -> online translation -> captions (+ optional TTS)
const LANGS = [
  { code: 'JA', name: { vi: 'Tiếng Nhật', ja: '日本語' }, speech: 'ja-JP', tr: 'ja' },
  { code: 'VI', name: { vi: 'Tiếng Việt', ja: 'ベトナム語' }, speech: 'vi-VN', tr: 'vi' },
  { code: 'EN', name: { vi: 'Tiếng Anh', ja: '英語' }, speech: 'en-US', tr: 'en' },
  { code: 'ZH', name: { vi: 'Tiếng Trung', ja: '中国語' }, speech: 'zh-CN', tr: 'zh-CN' },
  { code: 'KO', name: { vi: 'Tiếng Hàn', ja: '韓国語' }, speech: 'ko-KR', tr: 'ko' },
  { code: 'TH', name: { vi: 'Tiếng Thái', ja: 'タイ語' }, speech: 'th-TH', tr: 'th' },
];

// ---------- UI text (Vietnamese / Japanese) ----------
const I18N = {
  vi: {
    title: 'Dịch Trực Tiếp',
    ready: 'Sẵn sàng',
    listenLabel: 'Nghe',
    toLabel: 'Dịch sang',
    swap: 'Đổi chiều dịch',
    srcMic: 'Âm thanh xung quanh',
    srcSys: 'Âm thanh trong máy',
    srcGroup: 'Nguồn âm thanh',
    phIdle: 'Bấm nút micro bên dưới để bắt đầu nghe',
    phListen: 'Đang nghe…',
    phDst: 'Bản dịch sẽ hiện ở đây',
    history: 'Lịch sử',
    clear: 'Xoá tất cả',
    histEmpty: 'Chưa có câu nào. Các câu đã dịch sẽ được lưu ở đây.',
    tts: 'Đọc to',
    mic: 'Bắt đầu / dừng nghe',
    uiLang: 'Ngôn ngữ giao diện',
    copy: 'Sao chép',
    copied: 'Đã chép ✓',
    listening: (s, d) => `Đang nghe ${s} → dịch sang ${d}`,
    stopped: 'Đã dừng — bấm micro để nghe tiếp',
    shareEnded: 'Đã ngừng chia sẻ âm thanh.',
    micDenied: 'Chưa được cấp quyền micro. Hãy cho phép micro trong cài đặt trình duyệt.',
    network: 'Mất kết nối mạng — nhận dạng giọng nói cần Internet.',
    trFail: 'Không dịch được — kiểm tra kết nối mạng.',
    noTrack: 'Trình duyệt này chưa hỗ trợ nhận dạng từ âm thanh hệ thống. Hãy cập nhật Chrome/Edge bản mới nhất.',
    noSR: 'Trình duyệt này không hỗ trợ nhận dạng giọng nói. Hãy dùng Chrome (Android) hoặc Safari (iOS).',
    shareHint: 'Chọn "Toàn bộ màn hình" và bật "Chia sẻ âm thanh hệ thống" rồi bấm Chia sẻ.',
    noAudio: 'Chưa có âm thanh — hãy chọn "Toàn bộ màn hình" và tick "Chia sẻ âm thanh hệ thống".',
    shareCancel: 'Đã huỷ chia sẻ âm thanh.',
    export: 'Xuất báo cáo',
    expHtml: 'Báo cáo (HTML / in PDF)',
    expCsv: 'Excel (CSV)',
    expTxt: 'Văn bản (TXT)',
    noData: 'Chưa có câu nào để xuất báo cáo.',
    exported: 'Đã xuất báo cáo.',
    rTitle: 'Báo cáo dịch trực tiếp',
    rCreated: 'Ngày tạo',
    rPair: 'Chiều dịch',
    rSource: 'Nguồn âm thanh',
    rCount: 'Số câu',
    rNo: 'STT',
    rTime: 'Thời gian',
    rOrig: 'Câu gốc',
    rTrans: 'Bản dịch',
    rPrint: 'In / Lưu PDF',
    credit: (y, a) => `© ${y} ${a} · Bảo lưu mọi quyền`,

  },
  ja: {
    title: 'ライブ翻訳',
    ready: '準備完了',
    listenLabel: '聞く言語',
    toLabel: '翻訳先',
    swap: '翻訳の方向を入れ替え',
    srcMic: '周りの音',
    srcSys: 'パソコンの音',
    srcGroup: '音声の入力元',
    phIdle: '下のマイクボタンを押すと開始します',
    phListen: '聞き取り中…',
    phDst: 'ここに翻訳が表示されます',
    history: '履歴',
    clear: 'すべて削除',
    histEmpty: 'まだ履歴はありません。翻訳した文はここに保存されます。',
    tts: '読み上げ',
    mic: '開始 / 停止',
    uiLang: '表示言語',
    copy: 'コピー',
    copied: 'コピーしました ✓',
    listening: (s, d) => `${s}を聞き取り中 → ${d}に翻訳`,
    stopped: '停止しました — マイクを押すと再開します',
    shareEnded: '音声の共有を停止しました。',
    micDenied: 'マイクの使用が許可されていません。ブラウザの設定でマイクを許可してください。',
    network: 'ネットワークに接続できません — 音声認識にはインターネット接続が必要です。',
    trFail: '翻訳できませんでした — ネットワーク接続を確認してください。',
    noTrack: 'このブラウザはパソコンの音の認識に対応していません。Chrome / Edge を最新版に更新してください。',
    noSR: 'このブラウザは音声認識に対応していません。Chrome（Android）または Safari（iOS）をご利用ください。',
    shareHint: '「画面全体」を選び、「システム音声も共有する」をオンにして「共有」を押してください。',
    noAudio: '音声がありません — 「画面全体」を選び、「システム音声も共有する」にチェックを入れてください。',
    shareCancel: '音声の共有をキャンセルしました。',
    export: 'レポート出力',
    expHtml: 'レポート（HTML・PDF印刷）',
    expCsv: 'Excel（CSV）',
    expTxt: 'テキスト（TXT）',
    noData: '出力する履歴がありません。',
    exported: 'レポートを出力しました。',
    rTitle: 'ライブ翻訳レポート',
    rCreated: '作成日時',
    rPair: '翻訳方向',
    rSource: '音声の入力元',
    rCount: '件数',
    rNo: 'No.',
    rTime: '時刻',
    rOrig: '原文',
    rTrans: '訳文',
    rPrint: '印刷 / PDF保存',
    credit: (y, a) => `© ${y} ${a} · All rights reserved`,

  },
};

const $ = (id) => document.getElementById(id);
const srcSel = $('src'), dstSel = $('dst'), micBtn = $('mic'), statusEl = $('status');
const liveSrc = $('liveSrc'), liveDst = $('liveDst'), historyEl = $('history'), ttsBox = $('tts');

const store = {
  get(k, d) { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};

// First visit: follow the device language; Japanese users default to listening Vietnamese -> Japanese.
let ui = store.get('ui', null) || ((navigator.language || '').startsWith('ja') ? 'ja' : 'vi');
const T = () => I18N[ui];

for (const sel of [srcSel, dstSel]) {
  LANGS.forEach((l, i) => sel.add(new Option(l.name[ui], i)));
}
srcSel.value = store.get('src', ui === 'ja' ? '1' : '0');
dstSel.value = store.get('dst', ui === 'ja' ? '0' : '1');
ttsBox.checked = store.get('tts', '0') === '1';

const lang = (sel) => LANGS[+sel.value];
const langName = (sel) => lang(sel).name[ui];

// Status is stored as a key so it can be re-rendered when the UI language changes.
let statusKey = 'ready';
function setStatus(key) {
  statusKey = key;
  const msg = T()[key];
  statusEl.textContent = typeof msg === 'function' ? msg(langName(srcSel), langName(dstSel)) : msg;
}

function updateCodes() {
  const s = lang(srcSel).code, d = lang(dstSel).code;
  $('srcCode').textContent = s; $('dstCode').textContent = d; $('pair').textContent = `${s} → ${d}`;
}

function applyUi() {
  const t = T();
  document.documentElement.lang = ui;
  document.title = t.title;
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t[el.dataset.i18n]; });
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => el.setAttribute('aria-label', t[el.dataset.i18nAria]));
  liveSrc.dataset.ph = t.phIdle;
  liveSrc.dataset.phListen = t.phListen;
  liveDst.dataset.ph = t.phDst;
  historyEl.dataset.empty = t.histEmpty;
  for (const sel of [srcSel, dstSel]) {
    [...sel.options].forEach((o, i) => { o.text = LANGS[i].name[ui]; });
  }
  historyEl.querySelectorAll('.copy').forEach((b) => { b.textContent = t.copy; });
  document.querySelectorAll('#uiLang button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.ui === ui));
  $('credit').textContent = t.credit(new Date().getFullYear(), AUTHOR);
  setStatus(statusKey);
}

// ---------- Copyright / author logo ----------
// Change AUTHOR to the name you want shown. Put your logo in logo.png and run make-logo (see README) to embed it.
const AUTHOR = 'Nguyen Bi';
function initialsLogo() {
  const ini = AUTHOR.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return 'data:image/svg+xml,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5b5cf0"/><stop offset="1" stop-color="#a855f7"/></linearGradient></defs><circle cx="32" cy="32" r="32" fill="url(#g)"/><text x="32" y="41" font-family="Segoe UI,Arial,sans-serif" font-size="24" font-weight="700" fill="#fff" text-anchor="middle">${ini}</text></svg>`);
}
const LOGO = window.APP_LOGO || initialsLogo();
$('authorLogo').src = LOGO;

document.querySelectorAll('#uiLang button').forEach((b) => b.onclick = () => {
  ui = b.dataset.ui;
  store.set('ui', ui);
  applyUi();
});

// ---------- Translation (free online endpoints, with fallback) ----------
async function translate(text, from, to) {
  if (from === to) return text;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=${from}&tl=${to}&q=${encodeURIComponent(text)}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(r.status);
    const j = await r.json();
    return j[0].map((s) => s[0]).join('');
  } catch {
    const url = `https://api.mymemory.translated.net/get?langpair=${from}|${to}&q=${encodeURIComponent(text)}`;
    const r = await fetch(url);
    const j = await r.json();
    return j.responseData.translatedText;
  }
}

// ---------- Speech recognition ----------
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null, listening = false, speaking = false, wakeLock = null;
let sysStream = null, sysTrack = null; // system audio captured via screen share

const inputSel = $('input');
// System audio capture only exists on desktop browsers.
if (!navigator.mediaDevices?.getDisplayMedia) {
  inputSel.querySelector('option[value="system"]').remove();
}
inputSel.value = store.get('input', 'mic');
if (!inputSel.value) inputSel.value = 'mic';
inputSel.onchange = () => { store.set('input', inputSel.value); if (listening) { stop(); start(); } };
const segBtns = [...document.querySelectorAll('#seg button')];
const syncSeg = () => segBtns.forEach((b) => b.setAttribute('aria-pressed', b.dataset.v === inputSel.value));
segBtns.forEach((b) => b.onclick = () => {
  if (inputSel.value === b.dataset.v) return;
  inputSel.value = b.dataset.v; inputSel.onchange(); syncSeg();
});
if (!inputSel.querySelector('option[value="system"]')) {
  segBtns.find((b) => b.dataset.v === 'system').remove();
  $('seg').classList.add('single');
}
syncSeg();

async function getSystemAudio() {
  // Chrome only shares system audio when "Entire screen" + "Share system audio" are chosen.
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    systemAudio: 'include',
    selfBrowserSurface: 'exclude',
  });
  const track = stream.getAudioTracks()[0];
  if (!track) {
    stream.getTracks().forEach((t) => t.stop());
    throw new Error('no-audio');
  }
  track.onended = () => { if (listening) stop('shareEnded'); };
  return { stream, track };
}

const updateCount = () => { const n = historyEl.children.length; $('count').textContent = n ? `· ${n}` : ''; };

// History is kept in localStorage so it survives reloads and can be exported later.
let entries = [];
try { entries = JSON.parse(store.get('history', '[]')) || []; } catch { entries = []; }
const saveEntries = () => store.set('history', JSON.stringify(entries.slice(-500)));
const locale = () => (ui === 'ja' ? 'ja-JP' : 'vi-VN');
const fmtTime = (iso) => new Date(iso).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const fmtDateTime = (iso) => new Date(iso).toLocaleString(locale());

function addHistory(orig, trans) {
  const e = { at: new Date().toISOString(), o: orig, t: trans, s: lang(srcSel).code, d: lang(dstSel).code };
  entries.push(e);
  saveEntries();
  renderEntry(e);
}

function renderEntry({ at, o: orig, t: trans }) {
  const li = document.createElement('li');
  const time = fmtTime(at);
  li.innerHTML = `<div class="h-meta"><time></time><button class="copy" type="button"></button></div><p class="o"></p><p class="t"></p>`;
  li.querySelector('time').textContent = time;
  li.querySelector('.o').textContent = orig;
  li.querySelector('.t').textContent = trans;
  const copyBtn = li.querySelector('.copy');
  copyBtn.textContent = T().copy;
  copyBtn.onclick = async () => {
    try { await navigator.clipboard.writeText(trans); copyBtn.textContent = T().copied; } catch {}
    setTimeout(() => { copyBtn.textContent = T().copy; }, 1500);
  };
  historyEl.prepend(li);
  updateCount();
}

function speak(text) {
  if (!ttsBox.checked || !('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang(dstSel).speech;
  // Pause the mic while speaking so the app doesn't translate its own voice.
  speaking = true;
  rec?.abort();
  u.onend = u.onerror = () => { speaking = false; if (listening) startRec(); };
  speechSynthesis.speak(u);
}

let interimTimer = null, hearTimer = null;
async function handleFinal(text) {
  text = text.trim();
  if (!text) return;
  liveSrc.textContent = text;
  try {
    const t = await translate(text, lang(srcSel).tr, lang(dstSel).tr);
    liveDst.textContent = t;
    addHistory(text, t);
    speak(t);
  } catch {
    setStatus('trFail');
  }
}

function startRec() {
  if (speaking) return;
  rec = new SR();
  rec.lang = lang(srcSel).speech;
  rec.continuous = true;
  rec.interimResults = true;

  rec.onresult = (e) => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) handleFinal(r[0].transcript);
      else interim += r[0].transcript;
    }
    document.body.classList.add('hearing');
    clearTimeout(hearTimer);
    hearTimer = setTimeout(() => document.body.classList.remove('hearing'), 900);
    if (interim) {
      liveSrc.textContent = interim;
      // Live preview translation of the partial sentence (throttled).
      clearTimeout(interimTimer);
      interimTimer = setTimeout(async () => {
        try { liveDst.textContent = await translate(interim, lang(srcSel).tr, lang(dstSel).tr); } catch {}
      }, 400);
    }
  };
  rec.onerror = (e) => {
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') stop('micDenied');
    else if (e.error === 'network') setStatus('network');
  };
  // Browsers end recognition after silence; restart automatically to keep listening.
  rec.onend = () => { if (listening && !speaking) setTimeout(startRec, 250); };
  try {
    if (sysTrack) rec.start(sysTrack); else rec.start();
  } catch {
    if (sysTrack) stop('noTrack');
  }
}

async function start() {
  if (!SR) { setStatus('noSR'); return; }
  if (inputSel.value === 'system') {
    setStatus('shareHint');
    try {
      ({ stream: sysStream, track: sysTrack } = await getSystemAudio());
    } catch (err) {
      setStatus(err.message === 'no-audio' ? 'noAudio' : 'shareCancel');
      return;
    }
  }
  listening = true;
  document.body.classList.add('listening');
  setStatus('listening');
  liveSrc.textContent = '';
  liveDst.textContent = '';
  try { wakeLock = await navigator.wakeLock?.request('screen'); } catch {}
  startRec();
}

function stop(msgKey = 'stopped') {
  listening = false;
  document.body.classList.remove('listening', 'hearing');
  rec?.abort();
  speechSynthesis?.cancel();
  sysStream?.getTracks().forEach((t) => t.stop());
  sysStream = sysTrack = null;
  wakeLock?.release?.(); wakeLock = null;
  setStatus(msgKey);
}

function onLangChange() {
  store.set('src', srcSel.value); store.set('dst', dstSel.value);
  updateCodes();
  if (listening) { rec?.abort(); setStatus('listening'); }
}

micBtn.onclick = () => (listening ? stop() : start());
srcSel.onchange = dstSel.onchange = onLangChange;
ttsBox.onchange = () => store.set('tts', ttsBox.checked ? '1' : '0');
$('swap').onclick = () => {
  [srcSel.value, dstSel.value] = [dstSel.value, srcSel.value];
  onLangChange();
};
$('clear').onclick = () => {
  entries = []; saveEntries();
  historyEl.innerHTML = ''; updateCount(); liveSrc.textContent = ''; liveDst.textContent = '';
};

// ---------- Export report ----------
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

// Re-acquire wake lock when returning to the app.
document.addEventListener('visibilitychange', async () => {
  if (listening && document.visibilityState === 'visible') {
    try { wakeLock = await navigator.wakeLock?.request('screen'); } catch {}
  }
});

updateCodes();
entries.forEach(renderEntry);
applyUi();

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
