# Runbook: Deploy Local Môi trường Development

Tài liệu này hướng dẫn các bước để khởi chạy và vận hành toàn bộ hệ thống Admin Portal trên máy tính cá nhân bằng Docker Compose.

## Yêu cầu tiên quyết (Preconditions)
- Docker Desktop (hoặc Docker Engine & Docker Compose) đang hoạt động.
- RAM trống ít nhất 4GB (Khuyến nghị 8GB cho Docker).
- Đã sao chép `.env.template` thành `.env` và điền đủ các biến bắt buộc.

## Các bước khởi chạy (Steps to deploy)
1. **Kiểm tra file `.env`**:
   Bạn phải tạo file `.env` ở thư mục gốc của dự án. Nếu thiếu file này, kịch bản khởi chạy sẽ báo lỗi.
2. **Khởi chạy bằng script**:
   - Trên **Windows**: Mở PowerShell và chạy `.\start.ps1`
   - Trên **Linux/Mac**: Mở Terminal và chạy `./start.sh`
   *(Hoặc bạn có thể tự chạy lệnh: `docker compose up --build -d`)*
3. **Chờ các services khởi động**:
   Hệ thống sử dụng dependency health checks. `postgres`, `redis`, `kafka`, `keycloak` sẽ khởi động trước. Sau khi các dịch vụ nền tảng này `healthy`, các backend API (`auth-service`, `domain-service`) mới khởi động. Cuối cùng `gateway-service` và `frontend` sẽ khởi động.
4. **Kiểm tra trạng thái**:
   Sử dụng lệnh `docker compose ps` để xem tất cả các container. Hãy đảm bảo cột STATUS đều hiển thị `(healthy)`.
5. **Truy cập ứng dụng**:
   - Frontend: `http://localhost:80`
   - Gateway API: `http://localhost:8000`
   - Keycloak: `http://localhost:8080`

## Xử lý sự cố (Troubleshooting)
- **Thiếu biến môi trường (A1)**: Kiểm tra lại file `.env` và đảm bảo nó khớp các key với `.env.template`.
- **Trùng Port (A2)**: Nếu báo lỗi Address already in use (Vd: cổng 5432 bị chiếm), hãy tìm tiến trình đang giữ cổng đó trên máy (như PostgreSQL cài local) và tắt đi, hoặc đổi port map trong `docker-compose.yml`.
- **Service Unhealthy (A3)**: Dùng lệnh `docker compose logs <tên_service>` (vd: `docker compose logs auth-service`) để xem lỗi chi tiết. Nguyên nhân thường do kết nối CSDL, sai thông tin Kafka, hoặc Keycloak khởi động quá chậm.
- **Vấn đề Line Ending**: Nếu script init chạy lỗi trên Windows, đảm bảo cấu hình `core.autocrlf` của git là `false` đối với file sh/sql, hoặc convert file sang định dạng LF.
