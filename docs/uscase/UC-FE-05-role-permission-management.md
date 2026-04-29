# UC-FE-05 - Quản lý Phân quyền & Role (Role Matrix & Audit Log)

## Goal
Quản lý các chức danh (Role), gán quyền (Permissions) cho từng Role qua giao diện ma trận, và xem lịch sử kiểm toán bảo mật (Audit Log).

## Actors
- Primary: Admin
- Secondary: Angular RolesModule, Auth Service

## Preconditions
- User đăng nhập với role `ADMIN`.

## Main Flow
1. **Quản lý Role:**
   - Xem danh sách các Role (Admin, Department Lead, Finance Manager,...).
   - Thêm mới, sửa tên, hoặc vô hiệu hóa Role.
2. **Ma trận Phân quyền (Permission Matrix):**
   - Hiển thị danh sách tất cả các Permission có trong hệ thống (VD: `request.create`, `request.approve`, `report.view`).
   - Giao diện dạng bảng chéo: Cột là các Role, Hàng là các Permission. Các ô (cells) là Checkbox để gán/bỏ gán quyền.
   - Nút "Lưu thay đổi" để áp dụng phân quyền mới.
3. **Nhật ký Hệ thống (Rbac Audit Log):**
   - Trang xem lại lịch sử phân quyền. Ví dụ: "Admin A đã cấp quyền `request.approve` cho Role `Staff` vào lúc 10:00 AM".

## Alternate Flows
- A1: Nếu Admin bỏ quyền quản trị của chính mình -> Hệ thống cảnh báo và chặn hành động.

## Acceptance Criteria
- [ ] Giao diện Ma trận trực quan, dễ thao tác (sticky headers cho table).
- [ ] Tính năng gán quyền cập nhật chính xác xuống backend.
- [ ] Giao diện Audit Log cho phép lọc theo thời gian và hành động.
