# Mô Tả Chi Tiết Luồng Đăng Nhập (Login Flow)

Tài liệu này mô tả chi tiết quy trình xử lý đăng nhập của hệ thống Admin Portal, bám sát từng file code và phương thức thực tế.

---

## 1. Thành Phần Tham Gia
1.  **Frontend (Angular):** Thực hiện thu thập thông tin và hiển thị thông báo.
2.  **API Gateway:** Điều phối request.
3.  **Auth Service:** Trái tim xử lý logic nghiệp vụ bảo mật.
4.  **Keycloak:** Thành phần xác thực (Password check) thông qua chuẩn OIDC.
5.  **PostgreSQL & Redis:** Lưu trữ dữ liệu người dùng và metadata của phiên đăng nhập (Session).

---

## 2. Chi Tiết Luồng Xử Lý (Step-by-Step)

### Bước 1: Frontend thu thập thông tin
- **File:** `frontend/src/app/features/auth/login/login.component.ts`
- **Hành động:** Người dùng nhập `username` và `password`. Component gọi method `authService.login(request)`.
- **Dữ liệu gửi đi:** Một JSON object gồm `username`, `password`, và `deviceInfo`.

### Bước 2: Gateway điều phối
- **File:** `gateway-service/.../RouteConfig.java` (hoặc cấu hình YML)
- **Hành động:** Gateway nhận request tại `/api/v1/auth/login` và chuyển tiếp đến `auth-service` thông qua Load Balancer.

### Bước 3: Auth Controller tiếp nhận
- **File:** `com.adminportal.auth.infrastructure.web.controller.AuthController`
- **Method:** `login(@Valid @RequestBody LoginRequest req)`
- **Hành động:** 
    - Giải mã request (nếu có sử dụng `@Encrypted`).
    - Chuyển tiếp yêu cầu xuống lớp nghiệp vụ thông qua `loginUseCase.execute(req)`.

### Bước 4: Xử lý nghiệp vụ tại LoginUseCase
- **File:** `com.adminportal.auth.application.usecase.LoginUseCaseImpl`
- **Method:** `execute(LoginRequest request)`
- **Quy trình chi tiết:**
    1.  **Chuẩn hóa:** `username` được đưa về chữ thường và xóa khoảng trắng thừa.
    2.  **Xác thực mật khẩu (Keycloak):** Gọi `keycloakPort.authenticate(username, password)`. 
        - Lớp này (`KeycloakPasswordGrantAuthenticator`) gửi request `grant_type=password` sang Keycloak.
        - **Lưu ý:** Keycloak sử dụng `DatabaseUserStorageProvider` để truy vấn ngược lại database hệ thống nhằm kiểm tra mật khẩu.
    3.  **Kiểm tra trạng thái tài khoản:** Sau khi Keycloak xác nhận mật khẩu đúng, hệ thống tra cứu User trong DB.
        - Nếu `user.isActive() == false`: Ném lỗi `BusinessStateException("USER_INACTIVE")`.
    4.  **Kiểm tra 2FA:** Nếu user đã bật 2FA, hệ thống trả về mã `challenge` và yêu cầu người dùng nhập mã OTP thay vì cấp Token ngay.
    5.  **Cấp Token:** Nếu mọi thứ hợp lệ, gọi `authenticatedSessionService.create(user, deviceInfo)`.

### Bước 5: Khởi tạo Phiên làm việc (Session Creation)
- **File:** `com.adminportal.auth.application.service.impl.AuthenticatedSessionServiceImpl`
- **Hành động:**
    1.  **Single Session:** Thu hồi (Revoke) tất cả các Token cũ của user này trong database bằng cách set `active = false`.
    2.  **Mint JWT:** Sử dụng `JwtProvider` để tạo một chuỗi JWT mới chứa `username` và `role`.
    3.  **Lưu trữ Metadata:** Lưu thông tin Token (JTI, thời gian hết hạn) vào bảng `auth.tokens` trong PostgreSQL và đồng bộ vào Redis Cache để Gateway kiểm tra nhanh.

### Bước 6: Phản hồi lỗi (Error Handling)
- **File:** `com.adminportal.auth.infrastructure.web.GlobalExceptionHandler`
- **Hành động:** Nếu bất kỳ bước nào ở trên thất bại:
    - Lỗi sai mật khẩu -> Trả về: `"Sai tên đăng nhập hoặc mật khẩu."`
    - Lỗi tài khoản khóa -> Trả về: `"Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên."`
    - Các lỗi khác được đóng gói theo định dạng `ApiResponse` chuẩn.

---

## 3. Tổng Kết Luồng Dữ Liệu
```mermaid
sequenceDiagram
    participant FE as Frontend (Angular)
    participant GW as Gateway
    participant AS as Auth Service
    participant KC as Keycloak
    participant DB as Database (Postgres)

    FE->>GW: POST /api/v1/auth/login
    GW->>AS: Forward to Auth Service
    AS->>KC: OIDC Direct Grant (Password Check)
    KC->>DB: Query User (Custom SPI)
    DB-->>KC: User Credentials
    KC-->>AS: Auth OK
    AS->>DB: Check is_active & 2FA
    DB-->>AS: Active=True, 2FA=Off
    AS->>DB: Revoke old tokens & Save new token
    AS-->>FE: Return JWT + User Info
