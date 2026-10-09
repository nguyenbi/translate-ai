# Android package / Android パッケージ

Gói Android tạo bằng [PWABuilder](https://www.pwabuilder.com/) (Trusted Web Activity).
APK mở app `https://nguyenbi.github.io/translate-ai/` qua Chrome, nên nhận dạng giọng nói hoạt động như trên trình duyệt.

[PWABuilder](https://www.pwabuilder.com/)（Trusted Web Activity）で作成した Android パッケージです。
APK は Chrome 経由で `https://nguyenbi.github.io/translate-ai/` を開くため、音声認識はブラウザと同様に動作します。

| File | Nội dung / 内容 |
|---|---|
| `translate-ai-1.0.1.apk` | Cài trực tiếp lên Android / Android に直接インストール |
| `translate-ai-1.0.1.aab` | Dùng khi đăng lên Google Play / Google Play 公開用 |
| `assetlinks.json` | Digital Asset Links — đặt tại `https://nguyenbi.github.io/.well-known/assetlinks.json` để ẩn thanh địa chỉ / アドレスバーを非表示にするための設定 |

- Package ID: `io.github.nguyenbi.translateai`
- Version: 1.0.0.0 (version code 1)

## Cài đặt / インストール

1. Mở link dưới đây trên điện thoại Android (Chrome) để tải APK:
   `https://nguyenbi.github.io/translate-ai/android/translate-ai-1.0.1.apk`
2. Mở file vừa tải → cho phép *Cài đặt ứng dụng không rõ nguồn gốc* nếu được hỏi → **Cài đặt**.

1. Android 端末の Chrome で上記リンクを開き、APK をダウンロードします。
2. ダウンロードしたファイルを開き、「提供元不明のアプリ」を許可して **インストール** します。

> Chrome phải được cài trên máy. Khi chưa đặt `assetlinks.json`, app sẽ hiện thanh địa chỉ ở trên cùng.
> 端末に Chrome が必要です。`assetlinks.json` を配置するまでは画面上部にアドレスバーが表示されます。

## Khoá ký / 署名キー

`signing/` (khoá ký `signing.keystore` và mật khẩu `signing-key-info.txt`) **không được đưa lên git** — hãy sao lưu riêng.
Mất khoá này thì không thể phát hành bản cập nhật cho cùng app.

`signing/`（署名キーとパスワード）は **Git 管理対象外** です。別途バックアップしてください。
紛失すると同じアプリの更新版を公開できなくなります。
