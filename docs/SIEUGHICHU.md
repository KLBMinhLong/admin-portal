# 📋 PROJECT ARCHITECTURE NOTES
> Spring Boot · Keycloak · Clean Architecture · RBAC · 2FA · OpenTelemetry

---

## 1. TỔNG QUAN HỆ THỐNG

Hệ thống xác thực và phân quyền người dùng tự thiết kế, tích hợp Keycloak như một cổng xác thực (không dùng DB Keycloak để lưu người dùng), tự quản lý token, session, và phân quyền RBAC.

### Nguyên tắc cốt lõi
- **Clean Architecture** — tách biệt rõ Domain / Application / Infrastructure / Presentation
- **1 phiên đăng nhập duy nhất** — token cũ bị vô hiệu hóa khi đăng nhập thiết bị khác
- **Token không hết hạn theo thời gian** — vô hiệu hóa thủ công (revoke flag trong DB)
- **Mã hóa request/response** — dữ liệu nhạy cảm được mã hóa trước khi truyền
- **Không dùng schema `public`** — dùng schema riêng theo module/service

---

## 2. CÔNG NGHỆ SỬ DỤNG

| Thành phần | Công nghệ |
|---|---|
| Framework | Spring Boot + Spring Security |
| Xác thực ngoài | Keycloak (Custom Provider) |
| Logging | Log4j2 + Custom Layout XML |
| Observability | OpenTelemetry Java Instrumentation Agent |
| Object Mapping | MapStruct (Object Mapper) |
| Cache | Redis |
| DB | PostgreSQL (schema riêng, không dùng `public`) |
| Container | Docker + Docker Compose |
| Load Test | Apache JMeter |
| Profiles | Spring Boot Profiles + Environment Variable |
| Timezone | Cấu hình toàn cục (VD: `Asia/Ho_Chi_Minh`) |

---

## 3. CLEAN ARCHITECTURE — CẤU TRÚC THƯ MỤC

```
src/
├── domain/                         # Tầng Domain (core business)
│   ├── model/                      # Entity, Value Object, Enum
│   ├── repository/                 # Interface repository (port)
│   └── exception/                  # Domain Exception
│
├── application/                    # Tầng Application (use case)
│   ├── port/
│   │   ├── in/                     # Interface UseCase (input port)
│   │   └── out/                    # Interface Repository/Adapter (output port)
│   ├── service/                    # Interface Service (không chứa logic)
│   └── serviceimpl/                # ServiceImpl — chứa toàn bộ business logic
│
├── infrastructure/                 # Tầng Infrastructure
│   ├── adapter/
│   │   ├── persistence/            # JPA / Repository Impl
│   │   ├── cache/                  # Redis Adapter
│   │   └── keycloak/               # Keycloak Client Adapter
│   ├── config/                     # Spring Config (Security, Redis, OTel...)
│   ├── security/                   # JWT Filter, RBAC, API Key Filter
│   └── mapper/                     # MapStruct Mapper
│
└── presentation/                   # Tầng Presentation (Controller)
    ├── controller/
    ├── request/                    # DTO Request
    ├── response/                   # DTO Response
    └── advice/                     # Global Exception Handler
```

> **Quy tắc:** Controller → Service (interface) → ServiceImpl → Repository (interface) → Adapter  
> Không bao giờ gọi trực tiếp Infrastructure từ Presentation.

---

## 4. LUỒNG XÁC THỰC (AUTH FLOW)

### 4.1 Đăng nhập (Login)

```
FE ──[username, password]──► BE (AuthController)
                                    │
                          [Gửi credentials]
                                    ▼
                             Keycloak Server
                          (Custom Provider: DB/Remote)
                                    │
                          [Trả về OK / FAIL]
                                    ▼
                  BE nhận OK → Tạo token nội bộ
                  Token payload: { username, role[] }
                  ⚠️  Không thêm permission vào token
                  (Token chỉ mang tính định danh)
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
            Lưu token vào DB                  Lưu token vào Cache (Redis)
            (quản lý session)                 (tăng tốc kiểm tra)
                                    │
                  BE trả về token đã mã hóa cho FE
                                    │
                                    ▼
                          FE lưu token (đã mã hóa)
```

### 4.2 Gửi Request (Authenticated Request)

```
FE ──[Request + Encrypted Token]──► BE
                                         │
                              Decrypt token
                                         │
                              So sánh token với DB/Cache
                              Kiểm tra revoke flag
                                         │
                              Lấy role của user từ DB
                                         │
                              RBAC: kiểm tra quyền
                                         │
                              Chạy business logic
                                         │
                              Mã hóa Response → FE
```

### 4.3 Đăng xuất / Đăng nhập thiết bị khác (Session Management)

```
FE ──[Logout Request]──► BE
                              │
                    Tìm token hiện tại của user
                              │
                    Cắm cờ revoked = true (DB)
                    Xóa token khỏi Cache (Redis)
                              │
                    Đảm bảo token cũ không còn hoạt động
                    → Phiên cũ bị vô hiệu hóa ngay lập tức
```

> **Đảm bảo 1 phiên duy nhất:** Mỗi lần login thành công → revoke toàn bộ token cũ của user → tạo token mới.

---

## 5. TOKEN — THIẾT KẾ & LƯU TRỮ

### 5.1 Cấu trúc Token (Payload nội bộ)
```json
{
  "username": "user@example.com",
  "roles": ["ADMIN", "USER"],
  "issuedAt": "2024-01-01T00:00:00Z",
  "deviceId": "optional-device-fingerprint"
}
```
> ⚠️ **Không** chứa permission chi tiết, thông tin cá nhân, hay dữ liệu nhạy cảm.

### 5.2 Lưu trữ Token
```
┌────────────┐     đồng bộ     ┌───────────────┐
│  Database  │ ◄────────────── │  Redis Cache  │
│  (source   │ ──────────────► │  (fast check) │
│  of truth) │                 └───────────────┘
└────────────┘
       │
  Trường quan trọng:
  - token_hash (hash của token gốc)
  - user_id
  - revoked (boolean flag)
  - created_at
  - last_used_at
```

### 5.3 Token phía Client
- Token được **mã hóa** trước khi gửi về FE (AES hoặc tương đương)
- FE lưu token đã mã hóa (không đọc được plaintext)
- Mỗi request: FE gửi encrypted token → BE decrypt → verify

---

## 6. MẬT KHẨU — BẢO MẬT

### Hashing
- Dùng **BCrypt** với salt riêng kết hợp **userId** để đảm bảo:  
  → Cùng mật khẩu, khác user → hash khác nhau  
  → Không thể dùng mật khẩu của người này đăng nhập thay người khác

```
hash = BCrypt(password + userId_salt)
```

- **Không lưu** mật khẩu plaintext ở bất kỳ đâu
- **Không log** mật khẩu (xem phần Logging)

---

## 7. RBAC — PHÂN QUYỀN

### 7.1 Mô hình
```
User ──(has many)──► Role ──(has many)──► Permission
                                              │
                                    (Lưu trong DB, không trong token)
```

- 1 user có thể có nhiều role
- Role → Permission mapping lưu trong DB, load lên Cache khi khởi động
- Token chỉ chứa `roles[]`, không chứa `permissions[]`
- Khi cần kiểm tra permission → đọc từ Cache theo role

### 7.2 Cấu hình Security
```java
// Annotation-based RBAC
@PreAuthorize("hasRole('ADMIN')")
@PreAuthorize("hasPermission('USER_READ')")

// Hoặc kiểm tra thủ công trong SecurityFilter
```

### 7.3 Schema Database (không dùng schema `public`)
```sql
-- Schema: auth
CREATE SCHEMA auth;

auth.users
auth.roles
auth.user_roles         -- many-to-many
auth.permissions
auth.role_permissions   -- many-to-many
auth.tokens             -- quản lý session
auth.token_revocations  -- lịch sử revoke
```

---

## 8. API SECURITY

### 8.1 X-API-Key
- Mọi request từ external client phải kèm header `X-API-Key`
- API Key được kiểm tra trong Filter trước khi vào Controller
- Lưu API Key trong DB, cache vào Redis

```
Request → ApiKeyFilter → JwtTokenFilter → SecurityContext → Controller
```

### 8.2 Idempotency (Chống trùng lặp request)
- Yêu cầu client gửi header `Idempotency-Key` cho các request POST/PUT
- BE lưu `(idempotency_key → response)` vào Redis với TTL
- Nếu cùng key gửi lại trong TTL → trả về response đã cache, không xử lý lại

```
Request + Idempotency-Key
    │
    ├── Key tồn tại trong Redis? ──YES──► Trả về cached response
    │
    └── NO ──► Xử lý bình thường ──► Lưu response vào Redis (TTL) ──► Trả về
```

---

## 9. CÁC TÍNH NĂNG XÁC THỰC

### 9.1 Chức năng cần implement
- `POST /auth/login` — Đăng nhập
- `POST /auth/logout` — Đăng xuất (revoke token)
- `POST /auth/register` — Đăng ký
- `POST /auth/forgot-password` — Quên mật khẩu (gửi OTP/link email)
- `POST /auth/reset-password` — Đặt lại mật khẩu
- `POST /auth/2fa/enable` — Bật xác thực 2 yếu tố
- `POST /auth/2fa/verify` — Xác nhận mã 2FA
- `POST /auth/2fa/disable` — Tắt 2FA

### 9.2 Two-Factor Authentication (2FA)
- Sử dụng **TOTP** (Google Authenticator / Authy tương thích)
- Lưu `totp_secret` (mã hóa) trong DB theo từng user
- Flow 2FA:
```
Login OK → Kiểm tra 2FA enabled?
    │
    ├── NO  → Tạo token → Trả về token
    │
    └── YES → Trả về `mfa_required: true` + `mfa_session_token`
                   │
              FE gửi mã OTP + mfa_session_token
                   │
              BE xác thực OTP
                   │
              Tạo token chính → Trả về FE
```

---

## 10. LOGGING

### 10.1 Cấu hình
- **Bỏ Logback mặc định** của Spring Boot
- Dùng **Log4j2** với **Custom Layout XML**
- File cấu hình: `log4j2.xml` đặt trong `src/main/resources/`

### 10.2 Loại bỏ Logback
```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter</artifactId>
    <exclusions>
        <exclusion>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-logging</artifactId>
        </exclusion>
    </exclusions>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-log4j2</artifactId>
</dependency>
```

### 10.3 Custom Layout XML (log4j2.xml)
```xml
<Configuration status="WARN">
  <Appenders>
    <Console name="Console" target="SYSTEM_OUT">
      <PatternLayout pattern="%d{yyyy-MM-dd HH:mm:ss.SSS z} [%t] %-5level [%X{traceId}] [%X{requestId}] %logger{36} - %msg%n"/>
    </Console>
    <RollingFile name="File" fileName="logs/app.log"
                 filePattern="logs/app-%d{yyyy-MM-dd}.log.gz">
      <PatternLayout pattern="%d{yyyy-MM-dd HH:mm:ss.SSS z} [%t] %-5level [%X{traceId}] [%X{requestId}] %logger{36} - %msg%n"/>
      <Policies>
        <TimeBasedTriggeringPolicy/>
      </Policies>
    </RollingFile>
  </Appenders>
  <Loggers>
    <Root level="info">
      <AppenderRef ref="Console"/>
      <AppenderRef ref="File"/>
    </Root>
  </Loggers>
</Configuration>
```

### 10.4 Nội dung Log Cần Có
Mỗi log entry phải bao gồm:
- `timestamp` (có timezone)
- `traceId` (từ OpenTelemetry)
- `requestId` (UUID per request)
- `layer` (CONTROLLER / SERVICE / REPOSITORY)
- `method` + `endpoint`
- `responseTime` (ms) — **bắt buộc với API log**
- `userId` (nếu có, đã mask)
- `httpStatus`

### 10.5 Ẩn thông tin nhạy cảm trong Log
**Danh sách field KHÔNG được log plaintext:**
- `password`, `newPassword`, `confirmPassword`
- `token`, `accessToken`, `refreshToken`
- `cardNumber`, `cvv`, `accountNumber`
- `otp`, `totpSecret`
- `email` → log dạng `u***@***.com`
- `phone` → log dạng `09*****678`

**Cách implement:**
```java
// Dùng annotation hoặc utility mask
@Masked
private String email;

// Hoặc trong log statement
log.info("User login: email={}", MaskUtil.maskEmail(email));
```

### 10.6 Log theo tầng (Layer Logging)
```
[CONTROLLER] → Nhận request, log endpoint + params (masked) + requestId
[SERVICE]    → Log business action + userId + timestamp
[REPOSITORY] → Log query type (không log full query nếu có sensitive data)
[RESPONSE]   → Log status + responseTime(ms)
```

---

## 11. OPENTELEMETRY

### 11.1 Cấu hình Agent
```dockerfile
# Dockerfile
ENV JAVA_TOOL_OPTIONS="-javaagent:/app/opentelemetry-javaagent.jar"
ENV OTEL_SERVICE_NAME="auth-service"
ENV OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4317"
ENV OTEL_LOGS_EXPORTER="otlp"
ENV OTEL_TRACES_EXPORTER="otlp"
ENV OTEL_METRICS_EXPORTER="otlp"
```

### 11.2 Tích hợp traceId vào Log4j2
- OpenTelemetry Agent tự inject `traceId`, `spanId` vào MDC
- Log4j2 pattern dùng `%X{traceId}` để đọc từ MDC

---

## 12. MÃ HÓA REQUEST / RESPONSE

- Các endpoint nhạy cảm (login, register, profile) → payload được mã hóa
- Thuật toán: **AES-256-GCM**
- Key exchange: dùng **RSA** để trao đổi AES key lần đầu
- Header: `X-Encrypted: true` để BE biết cần decrypt

```
FE: encrypt(payload, aes_key) → gửi lên BE
BE: decrypt → xử lý → encrypt(response, aes_key) → trả về FE
```

---

## 13. CUSTOM ERROR CODE

Mỗi service có prefix mã lỗi riêng:

| Service | Prefix | Ví dụ |
|---|---|---|
| Auth Service | `AUTH_` | `AUTH_001` — Invalid credentials |
| User Service | `USR_` | `USR_001` — User not found |
| Token Service | `TKN_` | `TKN_001` — Token revoked |
| 2FA Service | `MFA_` | `MFA_001` — Invalid OTP |
| Permission | `RBC_` | `RBC_001` — Access denied |
| Common | `CMN_` | `CMN_001` — Internal server error |

**Response format chuẩn:**
```json
{
  "success": false,
  "errorCode": "AUTH_001",
  "message": "Invalid credentials",
  "timestamp": "2024-01-01T00:00:00+07:00",
  "requestId": "uuid-here",
  "traceId": "otel-trace-id"
}
```

---

## 14. TRANSACTION & EXCEPTION

### 14.1 Custom Transaction
- Dùng `@Transactional` ở tầng **ServiceImpl** (không ở Controller)
- Readonly transaction cho các query SELECT: `@Transactional(readOnly = true)`
- Rollback rõ ràng cho exception domain: `@Transactional(rollbackFor = DomainException.class)`

### 14.2 Exception Hierarchy
```
BaseException
├── DomainException          # Lỗi business logic
│   ├── AuthException        # AUTH_xxx
│   ├── UserException        # USR_xxx
│   ├── TokenException       # TKN_xxx
│   └── PermissionException  # RBC_xxx
├── InfrastructureException  # Lỗi hạ tầng (DB, Cache, External)
└── ValidationException      # Lỗi validate input
```

### 14.3 Global Exception Handler
```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    // Xử lý tất cả exception → trả về ErrorResponse chuẩn
    // Log đầy đủ thông tin (không log sensitive data)
    // Map errorCode theo từng exception type
}
```

---

## 15. SERVICE STRUCTURE

**Nguyên tắc:** Không viết hết logic vào 1 file, tách Service interface và ServiceImpl.

```java
// Interface (application/service/)
public interface AuthService {
    LoginResponse login(LoginRequest request);
    void logout(String token);
    void register(RegisterRequest request);
}

// Implementation (application/serviceimpl/)
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    // Toàn bộ business logic ở đây
    // Gọi qua các UseCase / Repository interface (không gọi trực tiếp JPA)
}
```

---

## 16. DASHBOARD & CACHE

- Dữ liệu dashboard **luôn load từ Cache (Redis)** trước
- Cache miss → query DB → lưu vào Cache → trả về
- Cache key chuẩn: `dashboard:{userId}:{metricType}`
- TTL dashboard cache: cấu hình theo profile (dev/prod)
- Invalidate cache khi có thao tác write liên quan

---

## 17. SPRING BOOT PROFILES

```
application.yml              # Base config
application-dev.yml          # Development
application-staging.yml      # Staging
application-prod.yml         # Production
```

**Environment Variables (không hardcode):**
```yaml
# application.yml
spring:
  datasource:
    url: ${DB_URL}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
  redis:
    host: ${REDIS_HOST}
    port: ${REDIS_PORT}

app:
  timezone: ${APP_TIMEZONE:Asia/Ho_Chi_Minh}
  encryption:
    key: ${ENCRYPTION_KEY}
  keycloak:
    url: ${KEYCLOAK_URL}
    realm: ${KEYCLOAK_REALM}
    client-id: ${KEYCLOAK_CLIENT_ID}
    client-secret: ${KEYCLOAK_CLIENT_SECRET}
```

---

## 18. TIMEZONE

```java
// Cấu hình toàn cục khi khởi động
@SpringBootApplication
public class Application {
    @PostConstruct
    public void init() {
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
    }
}
```

- Tất cả timestamp lưu DB: **UTC**
- Tất cả timestamp trả về API: **UTC+7 (Asia/Ho_Chi_Minh)** có kèm offset

---

## 19. DOCKER

### 19.1 Dockerfile
```dockerfile
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# OpenTelemetry Agent
ADD https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/latest/download/opentelemetry-javaagent.jar /app/opentelemetry-javaagent.jar

COPY target/*.jar app.jar

ENV JAVA_TOOL_OPTIONS="-javaagent:/app/opentelemetry-javaagent.jar \
    -Xms256m -Xmx400m \
    -XX:+UseContainerSupport \
    -XX:MaxRAMPercentage=75.0"

ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 19.2 Docker Compose Resource Limits
```yaml
services:
  auth-service:
    image: auth-service:latest
    deploy:
      resources:
        limits:
          cpus: '0.25'
          memory: 512M
        reservations:
          cpus: '0.10'
          memory: 256M
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - DB_URL=${DB_URL}
      # ... các biến môi trường khác

  redis:
    image: redis:7-alpine
    deploy:
      resources:
        limits:
          cpus: '0.25'
          memory: 256M

  postgres:
    image: postgres:16-alpine
    deploy:
      resources:
        limits:
          cpus: '0.50'
          memory: 512M
```

---

## 20. JMETER — ĐO LƯỜNG HIỆU NĂNG

### Kịch bản test cần có:
1. **Login Flow** — concurrent users login cùng lúc
2. **Authenticated Request** — token verify throughput
3. **2FA Flow** — OTP verify
4. **Dashboard Load** — cache hit/miss ratio
5. **Idempotency** — gửi duplicate request

### Metrics cần theo dõi:
- Response time (avg, p95, p99)
- Throughput (req/s)
- Error rate
- CPU / Memory usage (dưới giới hạn Docker: 0.25 CPU, 512MB RAM)

---

## 21. JAVADOC

Mỗi class và method public cần có JavaDoc:

```java
/**
 * Xác thực người dùng thông qua Keycloak và tạo session token nội bộ.
 *
 * @param request {@link LoginRequest} chứa username và password (đã mã hóa)
 * @return {@link LoginResponse} chứa encrypted token
 * @throws AuthException {@code AUTH_001} khi credentials không hợp lệ
 * @throws AuthException {@code AUTH_002} khi tài khoản bị khóa
 * @since 1.0.0
 */
LoginResponse login(LoginRequest request);
```

---

## 22. CHECKLIST TRIỂN KHAI

### Phase 1 — Foundation
- [ ] Cấu trúc Clean Architecture + packages
- [ ] Cấu hình Spring Profiles + ENV vars
- [ ] Cấu hình Log4j2 + loại bỏ Logback
- [ ] Cấu hình Timezone toàn cục
- [ ] Custom Error Code + Exception Hierarchy
- [ ] Global Exception Handler

### Phase 2 — Auth Core
- [ ] Schema DB (không dùng `public`)
- [ ] User / Role / Permission model + RBAC
- [ ] Keycloak Custom Provider
- [ ] Login / Logout / Register
- [ ] Hash mật khẩu (BCrypt + userId salt)
- [ ] Token tạo / lưu DB / lưu Cache / đồng bộ
- [ ] 1 phiên duy nhất (revoke token cũ)
- [ ] Token mã hóa phía client

### Phase 3 — Security Layer
- [ ] X-API-Key Filter
- [ ] JWT Token Filter
- [ ] Idempotency Filter
- [ ] Mã hóa Request/Response (AES-256)
- [ ] Log masking (ẩn thông tin nhạy cảm)

### Phase 4 — Features
- [ ] Forgot Password / Reset Password
- [ ] 2FA (TOTP)
- [ ] Dashboard Cache
- [ ] MapStruct Object Mapper

### Phase 5 — Observability
- [ ] OpenTelemetry Agent cấu hình
- [ ] Log theo tầng (Controller / Service / Repository)
- [ ] Response time trong API log
- [ ] Custom Layout XML hoàn chỉnh

### Phase 6 — DevOps
- [ ] Dockerfile (OTel Agent + JVM tuning)
- [ ] Docker Compose (resource limits hợp lý)
- [ ] JMeter test plans
- [ ] JavaDoc đầy đủ

---

*Tài liệu này là nguồn tham chiếu duy nhất (Single Source of Truth) cho toàn bộ team trong quá trình phát triển.*