// Live Translate: microphone / system audio -> speech recognition -> online translation -> captions (+ optional TTS)
// Depends on config.js (AUTHOR, LANGS) and i18n.js (I18N); report.js is loaded after this file.

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

// ---------- Author logo (embedded logo.js, or initials as a fallback) ----------
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
