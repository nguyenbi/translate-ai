// Extension-only additions to the web app, loaded right before app.js in the extension build
// (scripts/build-extension.ps1). The web app checks window.EXT to use them.

// "System audio" becomes the audio of the current tab; extra texts for the extension.
Object.assign(I18N.vi, {
  srcSys: 'Âm thanh tab này',
  shareHint: 'Đang lấy âm thanh của tab…',
  tabFail: 'Không lấy được âm thanh tab này — mở tab có video / cuộc họp, bấm biểu tượng extension trên tab đó rồi thử lại.',
  micDenied: 'Cần cho phép micro — đã mở một tab để cấp quyền, cấp xong hãy bấm micro lần nữa.',
});
Object.assign(I18N.ja, {
  srcSys: 'このタブの音',
  shareHint: 'タブの音声を取得しています…',
  tabFail: 'このタブの音声を取得できませんでした — 動画や会議のタブを開き、そのタブで拡張機能のアイコンを押してから再試行してください。',
  micDenied: 'マイクの許可が必要です — 許可用のタブを開きました。許可後にもう一度マイクを押してください。',
});

window.EXT = {
  // Capture the audio of the active tab in this window. Capturing mutes the tab for the user,
  // so the stream is also played back.
  async tabAudio() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    let stream;
    try {
      const id = await chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id });
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: id } },
      });
    } catch (err) {
      console.error('Tab capture failed:', err);
      throw new Error('tabFail');
    }
    const ctx = new AudioContext();
    ctx.createMediaStreamSource(stream).connect(ctx.destination);
    const track = stream.getAudioTracks()[0];
    track.addEventListener('ended', () => ctx.close());
    return { stream, track };
  },

  // The side panel can't show the microphone prompt; a normal tab can, and the permission then
  // applies to the whole extension.
  micDenied() {
    chrome.tabs.create({ url: chrome.runtime.getURL('mic.html') });
  },
};
