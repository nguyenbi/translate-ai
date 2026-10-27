// Clicking the toolbar icon opens the app in Chrome's side panel.
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
