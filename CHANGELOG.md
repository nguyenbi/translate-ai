# Changelog

## [1.1.1] - 2026-10-27

### Changed
- Nút "Xoá tất cả" thành menu Xoá: 24 giờ qua, 7 ngày qua, 30 ngày qua, Tất cả; hỏi xác nhận (kèm số câu) trước khi xoá

## [1.1.0] - 2026-10-27

### Added
- Báo cáo AI (HTML / in PDF): tóm tắt, ý chính, quyết định, việc cần làm, thuật ngữ song ngữ, kèm bản ghi đầy đủ
- Hộp thoại Cài đặt AI: nhập Anthropic API key (chỉ lưu trong trình duyệt) và chọn model Claude (Opus / Sonnet / Haiku 5.5)
- Không có key thì dùng AI có sẵn của Chrome (Gemini Nano) nếu máy hỗ trợ

### Fixed
- Giao diện không còn nhảy khi dịch cuộc họp: khung phụ đề có chiều cao cố định và luôn hiện dòng mới nhất, dòng trạng thái không xuống dòng
- Bản dịch tạm đến muộn không còn ghi đè bản dịch của câu đã hoàn chỉnh
- Bỏ qua câu bị Chrome trả về trùng 2 lần, nên lịch sử không còn câu lặp
- Bỏ dấu cách thừa giữa các từ tiếng Nhật / tiếng Trung khi nghe âm thanh máy tính

## [1.0.2] - 2026-10-09

### Added
- Gói Android (APK / AAB) tạo bằng PWABuilder, package `io.github.nguyenbi.translateai`, trong thư mục `android/`

## [1.0.1] - 2026-10-09

### Added
- Manifest: `id`, `lang`, `categories` và ảnh chụp màn hình (điện thoại / PC) để đóng gói APK và hiện trong hộp thoại cài đặt

## [1.0.0] - 2026-10-09

### Added
- Nghe qua micro (âm thanh xung quanh) hoặc âm thanh trong máy tính (chia sẻ âm thanh hệ thống, chỉ trên PC)
- Nhận dạng giọng nói liên tục và dịch trực tiếp, hiện bản dịch tạm trong lúc đang nói
- 6 ngôn ngữ: Nhật, Việt, Anh, Trung, Hàn, Thái; nút đổi chiều dịch
- Giao diện tiếng Việt / tiếng Nhật, tự chọn theo ngôn ngữ thiết bị ở lần mở đầu
- Đọc to bản dịch (tạm dừng micro khi đang đọc)
- Lịch sử dịch lưu trên trình duyệt (tối đa 500 câu), sao chép từng câu
- Xuất báo cáo HTML (in / lưu PDF), CSV (Excel), TXT
- Logo và dòng bản quyền trong app và báo cáo
- Cài đặt như app trên điện thoại (PWA), giữ màn hình sáng khi đang nghe
- Tài liệu README tiếng Việt và tiếng Nhật (README.ja.md)
