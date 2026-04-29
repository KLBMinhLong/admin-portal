# UC-FE-07 - Thiết lập cá nhân & Hồ sơ (User Profile & Settings)

## Goal
Cho phép người dùng quản lý thông tin cá nhân và thiết lập bảo mật.

## Actors
- Primary: Tất cả người dùng.

## Main Flow
1. **Trang Hồ sơ (My Profile):**
   - User click vào Avatar/Tên góc dưới bên trái (Sidebar), chọn "Hồ sơ của tôi".
   - Hiển thị thông tin: Username, Email, Role hiện tại, Ngày tham gia.
2. **Đổi Mật Khẩu (Change Password):**
   - Form nhập mật khẩu cũ, mật khẩu mới, và xác nhận mật khẩu.
   - Hiển thị thanh đo độ mạnh mật khẩu (Password strength meter).
3. **Quản lý Bảo mật 2FA (Two-Factor Authentication):**
   - Giao diện cho phép User Bật/Tắt 2FA.
   - Nếu bật: Hiển thị QR Code để quét qua Google Authenticator.

## Alternate Flows
- A1: Nhập sai mật khẩu cũ -> Báo lỗi.

## Acceptance Criteria
- [ ] UI Profile Page đơn giản, theo chuẩn thẻ Card của Design System.
- [ ] Luồng bật 2FA hiển thị mã QR đẹp và rõ ràng.
