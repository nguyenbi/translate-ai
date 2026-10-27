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

// Progress and errors go to a toast: the status line under the title is too narrow for them.
const toastEl = $('toast');
let toastTimer = null;
function toast(text, sticky = false) {
  toastEl.textContent = text;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  if (!sticky) toastTimer = setTimeout(() => { toastEl.hidden = true; }, 5000);
}
function notify(key, sticky) { setStatus(key); toast(T()[key], sticky); }

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
  $('pip').title = t.pip;
  syncTheme();
  setStatus(statusKey);
}

// ---------- Light / dark theme: auto (follow the device) -> light -> dark ----------
// The inline script in index.html applies the saved theme before the first paint.
const THEMES = ['auto', 'light', 'dark'];
const darkQuery = matchMedia('(prefers-color-scheme: dark)');
let theme = THEMES.includes(store.get('theme', 'auto')) ? store.get('theme', 'auto') : 'auto';

function syncTheme() {
  const root = document.documentElement;
  if (theme === 'auto') delete root.dataset.theme; else root.dataset.theme = theme;
  const dark = theme === 'dark' || (theme === 'auto' && darkQuery.matches);
  document.querySelector('meta[name="theme-color"]').content = dark ? '#0d0f1a' : '#f3f4fa';
  const label = T().theme(T()[`theme_${theme}`]);
  $('theme').setAttribute('aria-label', label);
  $('theme').title = label;
}
$('theme').onclick = () => {
  theme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
  store.set('theme', theme);
  syncTheme();
};
darkQuery.addEventListener('change', syncTheme);

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

const entryLi = new WeakMap(); // history entry -> its <li>, so a growing sentence can update its line

function addHistory(orig, trans) {
  const e = { at: new Date().toISOString(), o: orig, t: trans, s: lang(srcSel).code, d: lang(dstSel).code };
  entries.push(e);
  saveEntries();
  renderEntry(e);
  return e;
}

function updateHistory(e, orig, trans) {
  e.o = orig; e.t = trans;
  saveEntries();
  const li = entryLi.get(e);
  if (li) { li.querySelector('.o').textContent = orig; li.querySelector('.t').textContent = trans; }
}

function renderEntry(e) {
  const li = document.createElement('li');
  entryLi.set(e, li);
  li.innerHTML = `<div class="h-meta"><time></time><button class="copy" type="button"></button></div><p class="o"></p><p class="t"></p>`;
  li.querySelector('time').textContent = fmtTime(e.at);
  li.querySelector('.o').textContent = e.o;
  li.querySelector('.t').textContent = e.t;
  const copyBtn = li.querySelector('.copy');
  copyBtn.textContent = T().copy;
  copyBtn.onclick = async () => {
    try { await navigator.clipboard.writeText(e.t); copyBtn.textContent = T().copied; } catch {}
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

// The caption boxes have a fixed height; keep the newest line in view.
function setLive(el, text) {
  el.textContent = text;
  el.scrollTop = el.scrollHeight;
}

// Recognition of system audio puts spaces between Japanese / Chinese words, which also hurts translation.
const CJK = '\\u3000-\\u30ff\\u3400-\\u9fff\\uf900-\\ufaff\\uff00-\\uffef';
const CJK_GAP = new RegExp(`(?<=[${CJK}])\\s+(?=[${CJK}])`, 'g');
const tidy = (text) => (['JA', 'ZH'].includes(lang(srcSel).code) ? text.replace(CJK_GAP, '') : text).trim();

// Each translation request gets a number so a slow interim preview can't overwrite a newer caption.
let interimTimer = null, hearTimer = null, liveSeq = 0;
// Final results are handled one at a time, in order, so a sentence that grows can update its own line.
let lastFinal = '', lastFinalAt = 0, lastEntry = null, finalQueue = Promise.resolve();
function handleFinal(text) {
  text = tidy(text);
  if (text) finalQueue = finalQueue.then(() => processFinal(text));
}

async function processFinal(text) {
  const recent = Date.now() - lastFinalAt < 10000;
  // Chrome sometimes delivers the same final result twice.
  if (recent && text === lastFinal) return;
  // Chrome on Android repeats the whole sentence so far in each final result: update that line instead of adding one.
  const grows = recent && lastEntry && lastFinal && text.toLowerCase().startsWith(lastFinal.toLowerCase());
  const added = grows ? text.slice(lastFinal.length).trim() : text;
  lastFinal = text; lastFinalAt = Date.now();
  clearTimeout(interimTimer);
  const seq = ++liveSeq;
  setLive(liveSrc, text);
  try {
    const t = await translate(text, lang(srcSel).tr, lang(dstSel).tr);
    if (seq === liveSeq) setLive(liveDst, t);
    if (grows) updateHistory(lastEntry, text, t); else lastEntry = addHistory(text, t);
    // Read out only the new words, not the whole sentence again.
    if (!grows) speak(t);
    else if (added && ttsBox.checked) speak(await translate(added, lang(srcSel).tr, lang(dstSel).tr));
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
    interim = tidy(interim);
    if (interim) {
      setLive(liveSrc, interim);
      // Live preview translation of the partial sentence (throttled).
      clearTimeout(interimTimer);
      interimTimer = setTimeout(async () => {
        const seq = ++liveSeq;
        try {
          const t = await translate(interim, lang(srcSel).tr, lang(dstSel).tr);
          if (seq === liveSeq) setLive(liveDst, t);
        } catch {}
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
// Delete the history of the last N hours (0 = everything), after confirming.
function clearHistory(hours, label) {
  const since = hours ? Date.now() - hours * 3600e3 : 0;
  const keep = entries.filter((e) => new Date(e.at).getTime() < since);
  const n = entries.length - keep.length;
  if (!n) { setStatus('noneToClear'); return; }
  if (!confirm(T().confirmClear(n, label))) return;
  entries = keep; saveEntries();
  if (!entries.includes(lastEntry)) lastEntry = null;
  historyEl.innerHTML = '';
  entries.forEach(renderEntry);
  updateCount();
  if (!hours) { liveSrc.textContent = ''; liveDst.textContent = ''; }
  setStatus('cleared');
}
document.querySelectorAll('#clearMenu [data-hours]').forEach((b) => b.onclick = () => {
  $('clearMenu').open = false;
  clearHistory(+b.dataset.hours, b.textContent);
});
document.addEventListener('click', (e) => { if (!e.target.closest('#clearMenu')) $('clearMenu').open = false; });

// ---------- Floating caption window (Document Picture-in-Picture: Chrome / Edge on desktop) ----------
// The live card itself moves into an always-on-top window and comes back when it closes,
// so captions keep updating without any extra code.
const pipBtn = $('pip');
if ('documentPictureInPicture' in window) {
  pipBtn.hidden = false;
  pipBtn.onclick = async () => {
    if (documentPictureInPicture.window) { documentPictureInPicture.window.close(); return; }
    const live = $('live'), spot = document.createComment('live');
    let pip;
    try { pip = await documentPictureInPicture.requestWindow({ width: 460, height: 300 }); } catch (err) {
      console.error('Floating window failed:', err);
      notify('pipFail');
      return;
    }
    document.querySelectorAll('link[rel="stylesheet"]').forEach((l) => pip.document.head.append(l.cloneNode()));
    pip.document.title = T().title;
    // Keep the theme and the listening state (wave animation, placeholders) in sync with the main window.
    const sync = () => {
      pip.document.documentElement.lang = document.documentElement.lang;
      if (document.documentElement.dataset.theme) pip.document.documentElement.dataset.theme = document.documentElement.dataset.theme;
      else delete pip.document.documentElement.dataset.theme;
      pip.document.body.className = `${document.body.className} pip`;
    };
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'lang'] });
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    sync();
    live.before(spot);
    pip.document.body.append(live);
    setLive(liveSrc, liveSrc.textContent); setLive(liveDst, liveDst.textContent);
    pip.addEventListener('pagehide', () => {
      obs.disconnect();
      spot.replaceWith(live);
    });
  };
}

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
