# Dịch Trực Tiếp / ライブ翻訳

Web app (PWA) nghe âm thanh xung quanh hoặc âm thanh trong máy tính rồi dịch trực tiếp, hiện phụ đề và có thể đọc to bản dịch.

- Nhận dạng giọng nói: Web Speech API của trình duyệt (cần Internet)
- Dịch: Google Translate (bản miễn phí), dự phòng MyMemory
- Ngôn ngữ: Nhật, Việt, Anh, Trung, Hàn, Thái — giao diện tiếng Việt / tiếng Nhật
- Xuất báo cáo: HTML (in ra PDF), CSV (Excel), TXT

## Cài đặt trên điện thoại

- **Android**: mở link bằng Chrome → menu ⋮ → *Thêm vào màn hình chính* / *Cài đặt ứng dụng*
- **iPhone**: mở link bằng Safari → nút Chia sẻ → *Thêm vào MH chính*

## Logo bản quyền

Đặt ảnh vào `logo.png` rồi chạy:

```powershell
powershell -ExecutionPolicy Bypass -File make-logo.ps1
```

Tên tác giả nằm ở hằng `AUTHOR` trong `app.js`.

© 2026 Nguyen Bi
