# BACKEND LOGGING & EXCEPTION HANDLING RULES

**Purchasing Request Portal - Backend Observability Standards**

> Tài liệu này quy định cách thức ghi log và quản lý ngoại lệ (Exceptions), đảm bảo tính đồng bộ với hệ thống Log4j2 và OpenTelemetry.

---

## 1. Chiến lược Ghi Log (Logging Strategy)

Sử dụng Log4j2 thông qua SLF4J `@Slf4j`. Tuyệt đối tuân thủ các cấp độ (Levels) sau:

| Level | Nội dung cần ghi | Hành động của Dev |
| :--- | :--- | :--- |
| **DEBUG** | Các tham số đầu vào của hàm, kết quả tính toán chi tiết, SQL query (ở môi trường dev). | Phục vụ điều tra sâu. |
| **INFO** | Các sự kiện nghiệp vụ thành công: `User 'X' created request 'Y'`, `Login success`. | Dùng để theo dõi luồng nghiệp vụ. |
| **WARN** | Các lỗi do phía Client (4xx): `Invalid input`, `Unauthorized access`, `Resource not found`. | Không cần báo động ngay nhưng cần theo dõi tần suất. |
| **ERROR** | Các lỗi hệ thống (5xx): `Database down`, `NullPointerException`, `Timeout`. | Cần báo động (Alert) và xử lý ngay lập tức. |

### ✅ Quy tắc vàng:
1. **Contextual Logging:** Luôn kèm theo ID của đối tượng đang xử lý (e.g., `userId`, `requestId`).
2. **Trace ID:** Đảm bảo mọi dòng log đều được tự động gắn `traceId` thông qua MDC (Mapped Diagnostic Context) để khớp nối với OpenTelemetry.
3. **No PII:** Tuyệt đối không log mật khẩu, token, số thẻ tín dụng hoặc thông tin cá nhân nhạy cảm của khách hàng.

---

## 2. Quản lý Ngoại lệ (Exception Handling)

### 2.1. Cấu trúc Phân cấp Exception
Không sử dụng `RuntimeException` chung chung. Hãy xây dựng bộ Exception tùy chỉnh:

- **BaseBusinessException (Checked/Unchecked):** Lớp cha cho tất cả lỗi nghiệp vụ.
    - `ResourceNotFoundException` (404)
    - `InsufficientPermissionException` (403)
    - `InvalidWorkflowStepException` (400)
    - `ResourceConflictException` (409)

### 2.2. Global Exception Handler
Tất cả Exception phải được tập trung xử lý tại `@RestControllerAdvice`.
- **Lỗi nghiệp vụ (Business):** Log ở mức `WARN`, trả về mã lỗi và thông báo thân thiện.
- **Lỗi hệ thống (System):** Log ở mức `ERROR` (kèm đầy đủ Stack trace), trả về mã lỗi chung chung "Internal Server Error" để tránh lộ thông tin hệ thống.

---

## 3. Định dạng Response Lỗi chuẩn (Error Response)

Mọi lỗi trả về phải tuân thủ cấu trúc đồng nhất:
```json
{
  "timestamp": "2024-05-06T10:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Chi tiết lỗi cho user",
  "code": "ERROR_BUSINESS_001",
  "traceId": "abc-123-xyz"
}
