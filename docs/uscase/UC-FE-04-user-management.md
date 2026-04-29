# UC-FE-04 - Quản lý Người dùng (User Management)

## Goal
Cung cấp giao diện cho Admin để quản lý toàn bộ vòng đời của tài khoản người dùng trên hệ thống.

## Actors
- Primary: Admin
- Secondary: Angular UsersModule, Domain API (Auth Service)

## Preconditions
- User đăng nhập với role `ADMIN` hoặc có quyền `user.manage`.

## Main Flow
1. **Xem danh sách:** 
   - Admin truy cập trang Quản trị -> Người dùng.
   - Hệ thống hiển thị bảng danh sách người dùng (Tên, Email, Username, Role, Trạng thái).
   - Hỗ trợ phân trang (Pagination) và tìm kiếm (Search theo email/username).
2. **Tạo mới người dùng:**
   - Admin click "Thêm người dùng".
   - Điền form: Username, Email, Mật khẩu khởi tạo, Role.
   - Gửi request tạo user, hiển thị thông báo thành công.
3. **Cập nhật & Phân quyền:**
   - Click vào một user để sửa thông tin hoặc thay đổi Role (gán nhiều role hoặc 1 role).
4. **Khóa/Mở khóa (Deactivate/Activate):**
   - Admin có thể toggle trạng thái hoạt động của user (ví dụ khi nhân sự nghỉ việc).

## Alternate Flows
- A1: API lỗi hoặc validation không hợp lệ -> Hiển thị lỗi rõ ràng trên form.
- A2: Không có quyền truy cập -> Redirect về trang 403 Forbidden.

## Acceptance Criteria
- [ ] Bảng danh sách hiển thị đúng dữ liệu, có skeleton loading.
- [ ] Form tạo mới validate chặt chẽ (Email format, password strength).
- [ ] Thao tác Block/Unblock user hoạt động và cập nhật state tức thời.
- [ ] UI nhất quán với Design System (Sử dụng Badge cho trạng thái, Table chuẩn).
