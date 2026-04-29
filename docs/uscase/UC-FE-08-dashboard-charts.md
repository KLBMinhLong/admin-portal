# UC-FE-08 - Dashboard Charts & Thống kê trực quan

## Goal
Thay thế dữ liệu giả (placeholder) trên Dashboard bằng các biểu đồ trực quan, giúp người quản lý nhìn nhận tổng quan tình hình mua sắm.

## Actors
- Primary: Tất cả người dùng (Admin/Manager sẽ nhìn thấy số liệu toàn công ty, User thường chỉ nhìn thấy số liệu cá nhân).

## Main Flow
1. **Tích hợp Chart.js / ECharts:**
   - Cài đặt thư viện vẽ biểu đồ.
2. **Biểu đồ Trạng thái (Pie Chart):**
   - Vẽ biểu đồ tròn thể hiện tỷ lệ Request theo trạng thái (Pending, Approved, Rejected).
3. **Biểu đồ Chi phí (Bar/Line Chart):**
   - Biểu đồ cột thể hiện "Tổng chi phí mua sắm" theo từng tháng trong năm nay.
4. **Bảng Xếp Hạng (Leaderboard/Top Requests):**
   - Top 5 yêu cầu mua sắm có giá trị cao nhất đang chờ duyệt.

## Acceptance Criteria
- [ ] Biểu đồ render mượt mà, hỗ trợ tooltip khi hover.
- [ ] Tuân thủ bảng màu của Design System (Blue cho tổng, Green cho Approved, Amber cho Pending, Red cho Rejected).
- [ ] Dữ liệu tự động fetch từ Backend (cần tạo API thống kê tương ứng nếu chưa có).
