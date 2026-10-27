// AI report: the HTML report plus a summary, key points, decisions, action items and a glossary.
// Written by Claude with the user's own API key (kept only in this browser), or by Chrome's
// built-in on-device model when no key is set. Uses state and helpers from app.js and report.js.
const AI_KEY = 'aiKey', AI_MODEL = 'aiModel';
const CHROME_CHARS = 6000; // the on-device model has a small context window: only the latest lines fit

const AI_SCHEMA = (() => {
  const str = { type: 'string' }, list = (items) => ({ type: 'array', items });
  const obj = (props) => ({ type: 'object', additionalProperties: false, required: Object.keys(props), properties: props });
  return obj({
    summary: str,
    points: list(str),
    decisions: list(str),
    actions: list(obj({ task: str, owner: str, due: str })),
    terms: list(obj({ term: str, meaning: str, note: str })),
  });
})();

const aiDlg = $('aiDlg'), aiKeyIn = $('aiKey'), aiModelSel = $('aiModel');
aiModelSel.value = store.get(AI_MODEL, aiModelSel.options[0].value);

const transcript = (list) => list.map((e) => `[${fmtDateTime(e.at)}] ${e.s}: ${e.o}\n  ${e.d}: ${e.t}`).join('\n');

function aiPrompt(text) {
  const out = ui === 'ja' ? 'Japanese' : 'Vietnamese';
  return `Below is a transcript from a live speech translation app. Each entry has the original speech `
    + `(recognized automatically, so it may contain recognition errors) and its machine translation.\n\n`
    + `Write a meeting-style report in ${out}, using only what is in the transcript:\n`
    + `- summary: 3-5 sentences on what was discussed\n`
    + `- points: the key points, one short sentence each\n`
    + `- decisions: decisions or agreements reached (empty if none)\n`
    + `- actions: follow-up tasks; owner and due only if they were stated, otherwise an empty string\n`
    + `- terms: important terms, names and jargon; "term" as spoken in the original language, `
    + `"meaning" in ${out}, "note" a short explanation or the correct form if recognition got it wrong\n\n`
    + `<transcript>\n${text}\n</transcript>`;
}

// 'available', 'downloadable' / 'downloading' (Chrome fetches the model on first use), or '' when there is none.
async function chromeAi() {
  try {
    const a = 'LanguageModel' in window ? await LanguageModel.availability() : 'unavailable';
    return a === 'unavailable' ? '' : a;
  } catch { return ''; }
}

async function viaClaude(key, model, text) {
  const body = {
    model, max_tokens: 16000,
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: AI_SCHEMA } },
    messages: [{ role: 'user', content: aiPrompt(text) }],
  };
  const headers = {
    'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2026-10-21',
    'anthropic-dangerous-direct-browser-access': 'true',
  };
  // If a safety classifier declines, the API retries on another model (not offered for Haiku).
  if (!model.includes('haiku')) { body.fallbacks = 'default'; headers['anthropic-beta'] = 'server-side-fallback-2026-07-01'; }
  const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 || r.status === 403) throw new Error('aiBadKey');
  if (!r.ok || j.stop_reason !== 'end_turn') throw new Error(j.error?.message || j.stop_reason || r.status);
  return JSON.parse(j.content.find((b) => b.type === 'text').text);
}

async function viaChrome(text) {
  let s;
  // The on-device model only supports a few output languages; fall back to the default session.
  try { s = await LanguageModel.create({ expectedOutputs: [{ type: 'text', languages: [ui] }] }); } catch { s = await LanguageModel.create(); }
  try { return JSON.parse(await s.prompt(aiPrompt(text), { responseConstraint: AI_SCHEMA })); } finally { s.destroy(); }
}

function latest() {
  const list = [];
  let size = 0;
  for (let i = entries.length - 1; i >= 0; i--) {
    size += transcript([entries[i]]).length;
    if (size > CHROME_CHARS && list.length) break;
    list.unshift(entries[i]);
  }
  return list;
}

function aiIntro(ai, engine, used) {
  const t = T();
  const ul = (items) => `<ul>${items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
  const table = (heads, rows) => `<table><thead><tr>${heads.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>`
    + `<tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const parts = [`<h2>${esc(t.aSummary)}</h2><p>${esc(ai.summary)}</p>`];
  if (ai.points.length) parts.push(`<h2>${esc(t.aPoints)}</h2>${ul(ai.points)}`);
  if (ai.decisions.length) parts.push(`<h2>${esc(t.aDecisions)}</h2>${ul(ai.decisions)}`);
  if (ai.actions.length) parts.push(`<h2>${esc(t.aActions)}</h2>${table([t.aTask, t.aOwner, t.aDue], ai.actions.map((a) => [a.task, a.owner, a.due]))}`);
  if (ai.terms.length) parts.push(`<h2>${esc(t.aTerms)}</h2>${table([t.aTerm, t.aMeaning, t.aNote], ai.terms.map((x) => [x.term, x.meaning, x.note]))}`);
  const partial = used < entries.length ? ` ${t.aPartial(used, entries.length)}` : '';
  parts.push(`<p class="note">${esc(t.aNoteAi(engine) + partial)}</p>`);
  return `<section class="ai">${parts.join('')}</section><h2 class="tr">${esc(t.aTranscript)}</h2>`;
}

let aiBusy = false;
async function aiReport() {
  if (aiBusy) return;
  if (!entries.length) { setStatus('noData'); return; }
  const key = store.get(AI_KEY, '');
  let list = entries, engine, run, chrome = '';
  if (key) {
    const model = aiModelSel.value;
    engine = `Claude (${model})`;
    run = (text) => viaClaude(key, model, text);
  } else if ((chrome = await chromeAi())) {
    list = latest();
    engine = 'Chrome AI (Gemini Nano)';
    run = viaChrome;
  } else {
    openAiDlg('aiNeedKey');
    return;
  }
  aiBusy = true;
  setStatus(chrome && chrome !== 'available' ? 'aiDownload' : 'aiWorking');
  try {
    const ai = await run(transcript(list));
    const t = T();
    const html = reportHtml({
      title: t.aTitle,
      meta: `<div><b>${esc(t.aEngine)}</b>${esc(engine)}</div>`,
      intro: aiIntro(ai, engine, list.length),
    });
    download(`live-translate-ai-report-${stamp()}.html`, html, 'text/html;charset=utf-8');
    setStatus('exported');
  } catch (err) {
    console.error('AI report failed:', err);
    setStatus(err.message === 'aiBadKey' ? 'aiBadKey' : 'aiFail');
  } finally {
    aiBusy = false;
  }
}

async function openAiDlg(msgKey) {
  aiKeyIn.value = store.get(AI_KEY, '');
  $('aiChrome').textContent = '';
  if (msgKey) setStatus(msgKey);
  aiDlg.returnValue = ''; // Esc keeps the previous value otherwise
  aiDlg.showModal();
  const chrome = await chromeAi();
  $('aiChrome').textContent = T()[chrome === 'available' ? 'dChromeOk' : chrome ? 'dChromeDl' : 'dChromeNo'];
}

aiDlg.onclose = () => {
  if (aiDlg.returnValue === 'save') {
    store.set(AI_KEY, aiKeyIn.value.trim());
    store.set(AI_MODEL, aiModelSel.value);
    setStatus('aiSaved');
  } else if (aiDlg.returnValue === 'remove') {
    store.set(AI_KEY, '');
    setStatus('aiRemoved');
  } else {
    aiModelSel.value = store.get(AI_MODEL, aiModelSel.options[0].value);
  }
};

// Only "save" submits the form, so Enter in the key field saves instead of removing the key.
$('aiRemove').onclick = () => aiDlg.close('remove');
$('aiClose').onclick = () => aiDlg.close();
$('aiRun').onclick = () => { $('export').open = false; aiReport(); };
$('aiSet').onclick = () => { $('export').open = false; openAiDlg(); };
