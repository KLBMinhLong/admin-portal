# Mô Tả Chi Tiết Luồng Đăng Nhập (Login Flow)

Tài liệu này mô tả đúng theo code hiện tại của Admin Portal: từ lúc frontend gửi yêu cầu đăng nhập, qua bước xác thực ở Keycloak, cho đến lúc Auth Service tạo session và trả JWT riêng của hệ thống.

## 1. Tổng Quan Kiến Trúc

Luồng đăng nhập đi qua các thành phần chính sau:
1. **Frontend (Angular)**: Gửi `username` và `password`. Mô hình request có trường `deviceInfo`, nhưng hiện tại frontend chưa gán giá trị thật cho trường này.
2. **API Gateway**: Nhận request đầu tiên và route đến `auth-service`.
3. **Auth Service**: Xử lý nghiệp vụ đăng nhập, kiểm tra 2FA, cấp JWT riêng, và quản lý session.
4. **Keycloak**: Chỉ dùng để xác thực mật khẩu theo chuẩn OIDC Direct Grant (`grant_type=password`).
5. **DatabaseUserStorageProvider**: Custom SPI trong Keycloak, dùng để Keycloak tra cứu user trực tiếp từ database của hệ thống.
6. **Redis**: Lưu tạm `challenge` cho phiên 2FA dở dang.
7. **PostgreSQL**: Lưu user, role, permission, và session/token metadata.

---

## 2. Luồng Thực Tế

### Bước 1: Frontend gửi yêu cầu đăng nhập
- Frontend gọi `POST /auth/login`.
- Payload hiện tại chủ yếu là `username` và `password`.
- Field `deviceInfo` có trong contract backend, nhưng code frontend hiện tại chưa tự lấy thông tin thiết bị và chưa gán giá trị này khi gọi login.

### Bước 2: Request đi vào Auth Service
- Request đi qua API Gateway và vào `AuthController`.
- Controller gọi `loginUseCase.execute(request)`.

### Bước 3: Chuẩn hóa username
- Trong `LoginUseCaseImpl`, username được xử lý bằng `trim()` và `toLowerCase()` để tránh khác biệt do khoảng trắng hoặc chữ hoa/thường.

### Bước 4: Auth Service gọi Keycloak để xác thực
- `LoginUseCaseImpl` gọi `keycloakPort.authenticate(normalizedUsername, request.password())`.
- `keycloakPort` là interface port ở layer application.
- Implement thật nằm ở `KeycloakPasswordGrantAuthenticator`, dùng `RestClient` để gọi HTTP sang Keycloak.

### Bước 5: Keycloak nhận request và xác thực user
- Auth Service gửi request đến endpoint token của Keycloak theo `Resource Owner Password Credentials Grant`.
- Request form-urlencoded gồm:
  - `grant_type=password`
  - `client_id`
  - `client_secret` nếu có
  - `username`
  - `password`
  - `scope=openid`
- Khi Keycloak nhận request, nó uỷ quyền việc tra cứu user cho `DatabaseUserStorageProvider`.
- Custom SPI này đọc user từ database của hệ thống và kiểm tra password theo logic của plugin.
- Nếu sai credentials, Keycloak trả về lỗi 400/401 và Auth Service map thành `Invalid credentials`.
- Nếu có lỗi mạng hoặc Keycloak không phản hồi đúng, Auth Service map thành `Authentication provider unavailable`.
- Auth Service không dùng access token do Keycloak trả về; nó chỉ dùng kết quả xác thực thành công/thất bại.

### Bước 6: Auth Service kiểm tra user nội bộ
- Sau khi Keycloak xác thực thành công, Auth Service gọi `userRepository.findByUsernameForUpdate(normalizedUsername)`.
- Query này dùng lock mức database để tránh race condition khi cùng một user đăng nhập đồng thời.
- Nếu user không tồn tại hoặc không active, request bị từ chối.

### Bước 7: Xử lý 2FA nếu user bật xác thực hai lớp
- Nếu `user.isTwoFactorEnabled()` là `true`:
  - Auth Service tạo `challenge` bằng `challengeStore.create(user.getId(), request.deviceInfo())`.
  - `challenge` cùng `userId` và `deviceInfo` được lưu vào Redis với TTL ngắn.
  - Response trả về cho frontend là `requiresTwoFactor = true` và `challenge`.
- Nếu user không bật 2FA, Auth Service đi thẳng sang bước tạo session.

### Bước 8: Xác minh 2FA khi người dùng nhập OTP
- Khi frontend gọi verify 2FA, Auth Service đọc `challenge` từ Redis.
- Nếu challenge còn hợp lệ, Auth Service lấy lại `userId` và `deviceInfo` đã lưu trước đó.
- OTP được kiểm tra bằng `TwoFactorVerifierPort`.
- Nếu OTP hợp lệ, challenge bị xoá và Auth Service tiếp tục tạo session như đăng nhập bình thường.

### Bước 9: Cấp JWT và session của hệ thống
- `AuthenticatedSessionService.create(user, deviceInfo)` thực hiện:
  - Thu hồi toàn bộ session/token cũ của user để đảm bảo cơ chế single session.
  - Gọi `tokenGenerator.generate(user)` để sinh JWT mới.
  - JWT do `JwtProvider` tạo ra có các claim:
    - `sub` / subject = username
    - `username`
    - `role`
    - `userId`
    - `jti`
  - JWT này **không chứa danh sách authorities**.
  - Token được băm SHA-256 và lưu metadata session/token vào DB.
  - `deviceInfo` được lưu kèm session để phục vụ theo dõi thiết bị hoặc audit nếu cần.

### Bước 10: Trả response về frontend
- `AuthenticatedSessionService` gọi `RuntimePermissionService.getAllAuthorities(username)` để lấy toàn bộ quyền hiện tại của user.
- Danh sách này được nhét vào `LoginResponse.user.authorities`.
- Frontend nhận response và:
  - lưu JWT vào `auth_token_enc`
  - lưu object user, gồm `role` và `authorities`, vào `auth_user_enc`
  - nạp `authorities` vào state để dùng cho guard/menu ẩn hiện
- JWT và user object đều được mã hóa AES-GCM trước khi lưu vào localStorage theo implementation hiện tại.

---

## 3. Tóm Tắt Cơ Chế Keycloak

Luồng `keycloakPort.authenticate(username, password)` không phải là một lời gọi nội bộ tới SPI, mà là một HTTP call từ Auth Service sang Keycloak token endpoint.

Keycloak sau đó tự xử lý phần xác thực và uỷ quyền tra cứu user cho `DatabaseUserStorageProvider`. Đây là lý do Auth Service chỉ cần biết kết quả thành công/thất bại, còn logic đọc user từ DB nằm bên trong Keycloak plugin.

---

## 4. Điểm Cần Lưu Ý

- `deviceInfo` đã có ở backend contract nhưng frontend hiện chưa populate thật.
- JWT hiện tại chỉ dùng để xác thực request và quản lý session, không chứa authorities.
- Quyền hiển thị trên frontend đến từ `LoginResponse.user.authorities`, không phải từ token.
