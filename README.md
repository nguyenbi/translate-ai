# Dịch Trực Tiếp / ライブ翻訳

**Tiếng Việt** | [日本語](README.ja.md)

Web app (PWA) nghe âm thanh xung quanh hoặc âm thanh trong máy tính rồi dịch trực tiếp, hiện phụ đề và có thể đọc to bản dịch.

- Nhận dạng giọng nói: Web Speech API của trình duyệt (cần Internet)
- Dịch: Google Translate (bản miễn phí), dự phòng MyMemory
- Ngôn ngữ: Nhật, Việt, Anh, Trung, Hàn, Thái — giao diện tiếng Việt / tiếng Nhật
- Xuất báo cáo: HTML (in ra PDF), CSV (Excel), TXT

## Cấu trúc thư mục

```
.
├── index.html              # Trang chính
├── manifest.webmanifest    # Thông tin cài đặt PWA (tên, icon, màu)
├── sw.js                   # Service worker — phải nằm ở thư mục gốc để phủ toàn bộ app
├── assets/
│   ├── css/style.css       # Giao diện (sáng/tối)
│   ├── icons/              # Icon app 192/512px
│   ├── img/logo.png        # Ảnh logo gốc (không đưa lên git)
│   └── js/
│       ├── config.js       # AUTHOR (tên bản quyền), danh sách ngôn ngữ
│       ├── i18n.js         # Chữ hiển thị tiếng Việt / tiếng Nhật
│       ├── logo.js         # Logo đã nhúng base64 (sinh tự động)
│       ├── app.js          # Nhận dạng giọng nói, dịch, lịch sử, giao diện
│       └── report.js       # Xuất báo cáo HTML / CSV / TXT
└── scripts/make-logo.ps1   # Nhúng logo.png vào logo.js
```

Các file JS là script thường (không dùng ES module) và được nạp theo thứ tự trong `index.html`,
nên app chạy được cả khi mở trực tiếp `index.html` từ ổ đĩa.

## Cài đặt trên điện thoại

- **Android**: mở link bằng Chrome → menu ⋮ → *Thêm vào màn hình chính* / *Cài đặt ứng dụng*
- **iPhone**: mở link bằng Safari → nút Chia sẻ → *Thêm vào MH chính*

## Logo bản quyền

Đặt ảnh vào `assets/img/logo.png` rồi chạy:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/make-logo.ps1
```

Tên tác giả nằm ở hằng `AUTHOR` trong `assets/js/config.js`.

## Quy trình nhánh (Git Flow)

| Nhánh | Vai trò |
|---|---|
| `main` | Bản đang chạy thật (GitHub Pages deploy từ đây). Chỉ nhận merge từ `release/*` hoặc `hotfix/*` |
| `develop` | Nhánh tích hợp, chứa các tính năng đã xong cho bản kế tiếp |
| `feature/<tên>` | Mỗi tính năng một nhánh, tách từ `develop`, xong thì merge về `develop` |
| `release/<phiên bản>` | Chuẩn bị phát hành, tách từ `develop`, merge vào `main` + `develop`, gắn tag |
| `hotfix/<tên>` | Sửa lỗi gấp trên bản đang chạy, tách từ `main`, merge vào `main` + `develop` |

© 2026 Nguyen Bi
