# FRONTEND LOGGING & OBSERVABILITY RULES

**Purchasing Request Portal - Frontend Guidelines**

> Tài liệu này quy định cách thức ghi log, xử lý lỗi và tích hợp hệ thống quan sát (Observability) tại Frontend, đảm bảo tính đồng bộ với hệ thống Log4j2 và OpenTelemetry của Backend.

---

## 1. Phân cấp Log (Log Levels)

Tuyệt đối không sử dụng `console.log` một cách bừa bãi. Phải sử dụng `LoggingService` với các cấp độ sau:

| Level | Sử dụng khi nào | Môi trường hiển thị |
| :--- | :--- | :--- |
| **DEBUG** | Các thông tin chi tiết phục vụ phát triển (Giá trị biến, luồng đi). | Chỉ DEV |
| **INFO** | Các sự kiện quan trọng của User (Đăng nhập, chuyển trang, gửi yêu cầu thành công). | DEV & STAGING |
| **WARN** | Các tình huống không mong muốn nhưng chưa gây lỗi (Validation fail, Timeout nhẹ). | Tất cả |
| **ERROR** | Các lỗi Runtime, lỗi API (5xx), Crash ứng dụng. | Tất cả + Gửi về Server |

---

## 2. Quy tắc Nội dung Log (Logging Standards)

### ✅ Nên Log (DO)
- **Hành động nghiệp vụ:** `[Auth] User 'admin' logged in successfully`.
- **Luồng dữ liệu API:** `[API] Call GET /api/v1/requests - Success`.
- **Thông tin ngữ cảnh:** Tên Component, tên hàm đang thực thi.
- **Trace ID:** Luôn đính kèm `traceId` từ Backend trả về vào log nếu có lỗi.

### ❌ KHÔNG ĐƯỢC Log (DON'T)
- **Thông tin nhạy cảm (PII):** Mật khẩu, số điện thoại, email cá nhân (nếu không cần thiết).
- **Dữ liệu đã giải mã:** Tuyệt đối không log nội dung của các Request/Response đã được giải mã AES-GCM lên Console ở môi trường Production.
- **Token:** Không bao giờ log JWT Token ra console.

---

## 3. Distributed Tracing (OpenTelemetry Integration)

Để khớp nối log giữa FE và BE:
1. **Trace Context:** Mọi request gửi đi phải được đính kèm `traceId` trong header (sử dụng W3C Trace Context chuẩn).
2. **Correlation:** Khi một lỗi API xảy ra, FE phải trích xuất `X-Trace-Id` từ header của response để hiển thị hoặc log lại. Điều này giúp dev tìm đúng dòng log tương ứng trong Log4j2 của Backend.

---

## 4. Chiến lược Xử lý lỗi (Error Handling)

### 4.1. Global Error Handler
- Triển khai `ErrorHandler` của Angular để bắt các lỗi logic JS không được `try-catch`.
- Tự động đóng gói lỗi (Message, Stack trace, URL, User Agent) và gửi về endpoint `/api/v1/logs/error` của Backend.

### 4.2. HTTP Interceptor Logging
- Log mọi lỗi HTTP (4xx, 5xx) thông qua `HttpInterceptor`.
- Đối với lỗi 401/403: Log rõ hành vi truy cập trái phép.

---

## 5. Quy định theo Môi trường (Environment Rules)

- **Development:** Hiện đầy đủ log ra Browser Console để debug.
- **Production:**
    - Vô hiệu hóa `DEBUG` và `INFO` log trên Console.
    - Chỉ cho phép `WARN` và `ERROR` xuất hiện (nếu cần thiết).
    - Tự động đẩy `ERROR` log về hệ thống lưu trữ tập trung (Loki/Elasticsearch) thông qua API.

---

## 6. Checklist khi Implement
- [ ] Sử dụng `LoggingService` thay cho `console`.
- [ ] `GlobalErrorHandler` đã được cung cấp trong `AppConfig`.
- [ ] Log không chứa dữ liệu nhạy cảm.
- [ ] Đã cấu hình `environment` để bật/tắt log theo môi trường.
- [ ] Tích hợp `traceId` vào mọi log lỗi.
