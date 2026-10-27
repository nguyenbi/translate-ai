# Chrome / Edge extension / 拡張機能

Extension mở Dịch Trực Tiếp trong **thanh bên** (side panel) của Chrome / Edge và nghe được **âm thanh của tab**
(YouTube, Google Meet, Zoom bản web…) mà không cần chia sẻ màn hình. Dùng lại toàn bộ code của web app;
`ext.js` chỉ thêm phần riêng của extension.

Chrome / Edge の**サイドパネル**でライブ翻訳を開き、画面共有なしで**タブの音声**（YouTube、Google Meet、Web 版 Zoom など）を
聞き取れる拡張機能です。Web アプリのコードをそのまま使い、`ext.js` で拡張機能専用の処理だけを追加しています。

| File | Nội dung / 内容 |
|---|---|
| `manifest.json` | Manifest V3 — quyền `sidePanel`, `tabCapture` |
| `background.js` | Bấm biểu tượng extension → mở thanh bên / アイコンでサイドパネルを開く |
| `ext.js` | Âm thanh tab (`chrome.tabCapture`), chữ hiển thị riêng / タブ音声の取得、拡張機能用の文言 |
| `mic.html`, `mic.js` | Trang cấp quyền micro (thanh bên không hiện được hộp thoại xin quyền) / マイク許可用ページ |

## Build

```powershell
.\scripts\build-extension.ps1
```

Tạo `dist\extension\` (thư mục để cài) và `dist\live-translate-extension.zip` (để chia sẻ / đăng lên store).
Sửa web app xong thì chạy lại script. Nhớ tăng `version` trong `manifest.json` khi phát hành bản mới.

`dist\extension\`（インストール用フォルダ）と `dist\live-translate-extension.zip`（配布・ストア公開用）を作成します。
Web アプリを変更したら再実行してください。リリース時は `manifest.json` の `version` を上げます。

## Cài thủ công / 手動インストール

1. Mở `chrome://extensions` (Edge: `edge://extensions`).
2. Bật **Developer mode / Chế độ dành cho nhà phát triển** (góc trên bên phải).
3. Bấm **Load unpacked / Tải tiện ích đã giải nén** → chọn thư mục `dist\extension`
   (nếu nhận file zip thì giải nén trước rồi chọn thư mục đó).
4. Ghim biểu tượng Dịch Trực Tiếp lên thanh công cụ (biểu tượng mảnh ghép 🧩 → 📌).

Cập nhật: build lại rồi bấm nút ↻ của extension trong `chrome://extensions`.

1. `chrome://extensions`（Edge は `edge://extensions`）を開きます。
2. 右上の **デベロッパー モード** をオンにします。
3. **パッケージ化されていない拡張機能を読み込む** → `dist\extension` フォルダを選びます（zip の場合は展開してから）。
4. ツールバーの 🧩 からライブ翻訳を 📌 で固定します。

## Dùng / 使い方

- Bấm biểu tượng extension trên tab đang phát video / cuộc họp → thanh bên mở ra.
- Chọn **Âm thanh tab này** → bấm micro. Âm thanh vẫn phát bình thường. Muốn nghe tab khác: mở tab đó, bấm biểu tượng
  extension rồi bấm micro lại.
- Chọn **Âm thanh xung quanh** (micro): lần đầu extension mở một tab để cấp quyền micro; cấp xong bấm micro lần nữa.

- 動画や会議のタブで拡張機能のアイコンを押すと、サイドパネルが開きます。
- **このタブの音** を選んでマイクボタンを押します（音声はそのまま再生されます）。別のタブを聞くときは、そのタブで
  アイコンを押してから再度マイクを押します。
- **周りの音**（マイク）は、初回のみマイク許可用のタブが開きます。許可後にもう一度マイクを押してください。
