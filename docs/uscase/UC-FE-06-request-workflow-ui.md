# UC-FE-06 - Cải tiến UI Workflow Duyệt & Trao đổi (Request Workflow & Comments)

## Goal
Nâng cao trải nghiệm người dùng khi theo dõi và phê duyệt Request bằng sơ đồ trực quan và tính năng trao đổi.

## Actors
- Primary: Tất cả người dùng hệ thống.

## Main Flow
1. **Sơ đồ Quy trình (Stepper UI):**
   - Trong trang Chi tiết Request (`/requests/:id`), thay vì chỉ hiện lịch sử duyệt dạng text, thêm một component Stepper Component ở trên cùng.
   - Các bước: `Draft` -> `Pending Department Lead` -> `Pending Finance` -> `Approved`/`Rejected`.
   - Node hiện tại sẽ nhấp nháy hoặc highlight.
2. **Hệ thống Trao đổi (Thread Comments):**
   - Thêm một Sidebar hoặc Panel bên dưới Request Detail để User và Approver có thể chat/comment với nhau về request đó.
   - Hỗ trợ timeline view: Comment xen kẽ với các sự kiện thay đổi trạng thái (VD: User A comment -> Admin B approve).
3. **Chuông Thông báo (Notification Bell):**
   - Header bar có icon chuông. Hiện chấm đỏ khi có thông báo mới (ví dụ: Yêu cầu của bạn vừa được duyệt).
   - Dropdown list hiển thị top 5 thông báo mới nhất.

## Acceptance Criteria
- [ ] Component Stepper hiển thị chính xác trạng thái và responsive trên Mobile.
- [ ] Khung Chat/Comment realtime hoặc polling để update.
- [ ] Dropdown Notification thiết kế theo Design System (trông gọn gàng, có nút Đánh dấu đã đọc).
