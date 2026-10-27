// Apply the saved light / dark theme before the first paint (no flash). Logic lives in app.js.
// A separate file, not inline, because the browser extension's CSP forbids inline scripts.
try { const t = localStorage.getItem('theme'); if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t; } catch {}
