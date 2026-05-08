# Chi Tiết Cơ Chế Bảo Mật & Quản Lý Token

Tài liệu này giải thích các cơ chế kỹ thuật bên dưới lớp nghiệp vụ của hệ thống Admin Portal.

---

## 1. Cơ Chế Quản Lý Token (JWT Lifecycle)

### 1.1 Cấp Phát Token (Issuance)
- **File:** `com.adminportal.auth.infrastructure.security.JwtProvider`
- **Logic:** Khi đăng nhập thành công, hệ thống sử dụng thư viện `jjwt` để tạo chuỗi JWT.
- **Claims:** JWT chứa `sub` (username), `userId`, `role` và đặc biệt là `jti` (JWT ID) - một UUID duy nhất cho mỗi session.
- **Lưu ý:** Quyền hạn (authorities) **không** được lưu trong Token để tránh kích thước Token quá lớn và đảm bảo quyền luôn được cập nhật mới nhất từ DB.

### 1.2 Lưu Trữ Token (Storage)
Hệ thống sử dụng cơ chế lưu trữ kép (Dual Storage):
1.  **PostgreSQL (`auth.tokens`):** Lưu metadata đầy đủ để phục vụ audit và quản lý lịch sử (trạng thái `is_active`, thiết bị, thời gian hết hạn).
2.  **Redis:** Cache lại các Token đang active. Gateway sẽ nhìn vào Redis trước để xác thực (Fast-path) nhằm giảm tải cho Database.

### 1.3 Thu Hồi Token (Revocation & Single Session)
- **File:** `com.adminportal.auth.application.service.impl.AuthenticatedSessionServiceImpl`
- **Cơ chế:** Khi User đăng nhập mới, hệ thống gọi `tokenRepository.revokeAllUserTokens(userId)`. 
- **Hành động:** Set `is_active = false` cho toàn bộ token cũ của User đó. Các request tiếp theo mang Token cũ sẽ bị Filter chặn lại vì trạng thái trong DB/Redis đã là Inactive.

---

## 2. Cơ Chế Lấy & Kiểm Tra Quyền (Permissions)

### 2.1 Lấy Quyền Ở Đâu? (Data Source)
Quyền được lấy trực tiếp từ database hệ thống (Schema `auth`), không lấy từ Keycloak.
- **File:** `com.adminportal.auth.application.service.impl.RuntimePermissionServiceImpl`
- **Logic truy vấn:** Kết hợp dữ liệu từ 3 bảng: `users` -> `user_roles` -> `roles` -> `role_permissions` -> `permissions`.

### 2.2 Kiểm Tra Quyền Tại Runtime
- **Tại Backend:** 
    - `AuthTokenFilter` nạp danh sách quyền vào `SecurityContext` của Spring mỗi khi có request đến.
    - Sử dụng `@PreAuthorize("hasAuthority('...')")` tại các Controller để kiểm tra quyền truy cập.
- **Tại Frontend:** 
    - Danh sách `authorities` được trả về trong body của response đăng nhập.
    - Frontend lưu vào state để ẩn/hiện menu và dùng `AuthGuard` để chặn truy cập trang.

---

## 3. Cơ Chế Mã Hóa & Giải Mã (Encryption)

### 3.1 Giải Mã Request & Mã Hóa Response
Hệ thống sử dụng cơ chế AOP (Aspect Oriented Programming) để tự động hóa việc này.
- **Annotation:** `@Encrypted`
- **File:** `com.adminportal.auth.infrastructure.encryption.EncryptionAspect`
- **Quy trình:**
    1.  **Request:** Khi một request đến Controller có đánh dấu `@Encrypted`, Aspect sẽ lấy chuỗi Base64 trong payload, dùng thuật toán **AES-GCM** để giải mã thành JSON trước khi truyền vào hàm xử lý.
    2.  **Response:** Trước khi dữ liệu rời khỏi Controller, Aspect sẽ mã hóa lại body thành chuỗi an toàn.

### 3.2 Mã Hóa Tại Frontend
Để bảo vệ dữ liệu khỏi các cuộc tấn công XSS hoặc xem trộm localStorage:
- **File:** `frontend/src/app/core/services/encryption.service.ts`
- **Logic:** Toàn bộ `auth_token` và `auth_user` đều được mã hóa bằng AES với một `secret_key` trước khi lưu xuống trình duyệt.

---

## 4. Tóm Tắt Bảo Mật
| Thành phần | Cơ chế sử dụng | Mục tiêu |
| :--- | :--- | :--- |
| **Xác thực** | Keycloak (OIDC) | Quản lý định danh tập trung |
| **Phân quyền** | Database-backed RBAC | Linh hoạt, cập nhật tức thì |
| **Session** | JWT + Redis | Stateless, hiệu năng cao |
| **Dữ liệu** | AES-GCM Encryption | Bảo mật đường truyền và lưu trữ |
