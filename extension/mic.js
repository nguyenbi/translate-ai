// Grants microphone access to the extension: the side panel can't show the permission prompt.
const ja = (localStorage.getItem('ui') || navigator.language).startsWith('ja');
const T = ja ? {
  title: 'マイクの使用を許可',
  desc: 'ライブ翻訳が周りの音を聞き取るには、マイクの許可が必要です。下のボタンを押し、表示された確認で「許可」を選んでください。',
  allow: 'マイクを許可する',
  ok: '✓ 許可しました。このタブを閉じ、サイドパネルでもう一度マイクを押してください。',
  no: 'マイクが許可されませんでした。アドレスバーのアイコンから許可するか、もう一度お試しください。',
} : {
  title: 'Cho phép dùng micro',
  desc: 'Để Dịch Trực Tiếp nghe được âm thanh xung quanh, extension cần quyền dùng micro. Bấm nút bên dưới rồi chọn "Cho phép".',
  allow: 'Cho phép micro',
  ok: '✓ Đã cho phép. Bạn có thể đóng tab này và bấm micro lần nữa trong thanh bên.',
  no: 'Chưa được cấp quyền micro. Hãy bấm biểu tượng trên thanh địa chỉ để cho phép, hoặc thử lại.',
};
document.documentElement.lang = ja ? 'ja' : 'vi';
for (const id of ['title', 'desc', 'allow']) document.getElementById(id).textContent = T[id];

document.getElementById('allow').onclick = async () => {
  const msg = document.getElementById('msg');
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    msg.textContent = T.ok;
    setTimeout(() => window.close(), 2500);
  } catch {
    msg.textContent = T.no;
  }
};
