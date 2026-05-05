# Mô Tả Chi Tiết Luồng Đăng Nhập (Login Flow)

Tài liệu này mô tả chi tiết luồng hoạt động của tính năng đăng nhập trong hệ thống Admin Portal, từ lúc người dùng gửi yêu cầu ở Frontend cho đến khi xác thực thành công và nhận được JWT token.

## 1. Tổng quan Kiến trúc

Luồng đăng nhập đi qua các thành phần chính sau:
1. **Frontend (Angular)**: Thu thập `username`, `password`, `deviceInfo` và mã TOTP (nếu có 2FA).
2. **API Gateway**: Nơi tiếp nhận request đầu tiên, định tuyến (route) request đến `auth-service`.
3. **Auth Service**: Xử lý logic nghiệp vụ chính (kiểm tra trạng thái user, kiểm tra 2FA, cấp phát JWT, thu hồi session cũ).
4. **Keycloak (External Identity Access Management)**: Đóng vai trò là hệ thống xác thực tập trung.
5. **DatabaseUserStorageProvider**: Một Custom SPI plugin được cắm (deploy) thẳng vào Keycloak để Keycloak có thể đọc trực tiếp từ bảng `users` của Postgres (thay vì lưu user ở database riêng của Keycloak).
6. **Redis**: Dùng để lưu trữ tạm thời mã `challenge` (nếu user có bật 2FA).
7. **PostgreSQL**: Lưu trữ thông tin user, thông tin session, phân quyền, v.v.

---

## 2. Chi Tiết Các Bước Thực Hiện (Step-by-Step)

### Bước 1: Gửi yêu cầu đăng nhập
- **Client (Frontend)** gửi POST request `/auth/login` mang theo payload: `LoginRequest(username, password, deviceInfo)`.
- Request đi qua API Gateway và được forward vào **Auth Service**.

### Bước 2: Tiếp nhận tại Controller
- **File**: `AuthController.java` (`com.adminportal.auth.infrastructure.web.controller`)
- Hệ thống tiếp nhận request và gọi `loginUseCase.execute(request)`.

### Bước 3: Tiền xử lý dữ liệu
- **File**: `LoginUseCaseImpl.java` (`com.adminportal.auth.application.usecase`)
- Username được chuẩn hóa bằng cách loại bỏ khoảng trắng dư thừa (`trim()`) và chuyển sang chữ thường (`toLowerCase()`).

### Bước 4: Gọi sang Keycloak để xác thực (External Integration)
- Hệ thống gọi hàm `keycloakPort.authenticate(normalizedUsername, password)`.
- Request HTTP được gửi sang hệ thống **Keycloak** thông qua chuẩn `Resource Owner Password Credentials Grant`.
- Khi Keycloak nhận được request, nó sẽ uỷ quyền việc tra cứu user cho một Custom SPI: `DatabaseUserStorageProvider`.

### Bước 5: Keycloak kiểm tra mật khẩu trong Database
- **File**: `DatabaseUserStorageProvider.java` (`com.adminportal.keycloak.provider` - Plugin cắm vào Keycloak)
- Keycloak tự động kết nối trực tiếp vào Postgres (bảng `auth.users`).
- Provider tìm kiếm user theo `username` hoặc `email`.
- **Thuật toán giải mã/mã hoá mật khẩu**:
  - Mật khẩu gốc được kiểm tra bằng hàm `BCrypt.checkpw()`.
  - Để tăng cường tính bảo mật và chống lại tấn công copy hash (chép chuỗi băm của user này sang user khác), chuỗi để đối chiếu với hash trong DB được kết hợp từ `username` và `password` theo định dạng: `username:rawPassword` (với username ở dạng in thường).
  - Nếu `BCrypt.checkpw(username + ":" + password, storedHash)` trả về `true`, Keycloak xác nhận mật khẩu đúng.
- Keycloak trả về phản hồi thành công (kèm Token của Keycloak, tuy nhiên Auth Service sẽ bỏ qua Token này vì hệ thống sẽ tự cấp JWT riêng rẽ).

### Bước 6: Khóa Row và Kiểm tra trạng thái User tại Auth Service
- **File**: `LoginUseCaseImpl.java`
- Auth Service gọi DB query `findByUsernameForUpdate()`. Đây là query có dùng khóa mức cơ sở dữ liệu (`FOR UPDATE`) để đảm bảo không có tình trạng cùng một user đăng nhập đồng thời 2 nơi tạo ra lỗi race condition.
- Kiểm tra `user.isActive()`. Nếu user bị khóa, throw Exception.

### Bước 7: Xử lý Xác thực 2 Lớp (2FA / TOTP)
- Hệ thống kiểm tra cờ `user.isTwoFactorEnabled()`.
  - **Nếu có 2FA**:
    - Hệ thống tạo ra một `challenge` string (chuỗi ngẫu nhiên định danh cho phiên đăng nhập dở dang này).
    - Lưu `challenge` vào **Redis** (`ChallengeStorePort`) kèm theo ID của user và `deviceInfo`. Thời gian tồn tại (TTL) của challenge thường là 5-10 phút.
    - Phản hồi về Frontend trạng thái: `REQUIRES_2FA` và mã `challengeId`. Quá trình đăng nhập tạm dừng tại đây. Frontend sẽ chuyển hướng user sang màn hình nhập TOTP.
  - **Nếu KHÔNG có 2FA**: Sang trực tiếp Bước 8.

### Bước 8: Xử lý cấp JWT và Session (Single Session)
- **File**: `AuthenticatedSessionService.java` (`com.adminportal.auth.application.services`)
- Nếu user vượt qua mọi rào cản (mật khẩu đúng, tài khoản active, không dính 2FA hoặc đã giải quyết 2FA), hệ thống bắt đầu tiến trình cấp token.
- **Thu hồi Token Cũ**: 
  - Gọi `userSessionRevocationService.revokeAll(user.getId())`. 
  - Hệ thống áp dụng cơ chế *Single Session* (mỗi user chỉ có 1 phiên hoạt động). Mọi phiên đăng nhập cũ trong DB lập tức bị huỷ.
- **Sinh JWT (Token Generator)**:
  - Sinh ra chuỗi JWT (`access_token`) bằng thuật toán `RS256` hoặc thuật toán bảo mật tương tự (do class `TokenGeneratorPort` thực thi). JWT này chứa định danh user, ngày sinh, hạn sử dụng.
- **Lưu trữ Session bảo mật**:
  - Token không được lưu plaintext trong DB. Để bảo mật, giá trị của Token được băm qua thuật toán **SHA-256** (hàm `sha256(generatedToken.value())`).
  - Bản ghi Token (`jti`, `userId`, `hashedValue`, `deviceInfo`) được lưu vào bảng `tokens`.

### Bước 9: Nạp phân quyền (RBAC) và Phản hồi Frontend
- Hệ thống gọi sang `RuntimePermissionService.getPermissionCodes(username)` để trích xuất tập hợp tất cả các mã phân quyền mà user này đang có.
- Gộp role và permissions lại vào một List `authorities`.
- Dựng object `LoginResponse` gửi lại Frontend chứa:
  - `token`: Chuỗi JWT (chưa mã hoá, dùng để Frontend gắn vào HTTP Headers Bearer).
  - `userId`, `username`, `role`.
  - `authorities`: Danh sách mã đặc quyền.

### Bước 10: Xử lý tại Frontend (Bảo mật Client-side)
- Frontend nhận được HTTP 200 OK.
- JWT token được lưu trữ vào bộ nhớ hoặc `localStorage`/`sessionStorage`.
- Danh sách `authorities` (phân quyền) không được lưu dạng plain text ở dưới trình duyệt mà được **mã hoá đối xứng** (encrypted) trước khi lưu vào `localStorage` nhằm chống việc người dùng dùng công cụ DevTools sửa quyền của chính mình trên trình duyệt để thấy các button/menu ẩn.
- Chuyển hướng người dùng vào giao diện Dashboard. Quy trình đăng nhập kết thúc thành công.
