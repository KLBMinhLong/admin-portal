# Purchasing Request Portal - Yêu Cầu Chi Tiết & Quy Tắc Code

> **Ngày tạo**: 24/04/2026  
> **Bản phát hành**: 1.0 - Core Requirements  
> **Status**: Active Development

---

## 📌 I. TỔNG QUAN HỆ THỐNG

### Tên Dự Án
**Purchasing Request Portal (Cổng Yêu cầu Mua sắm Nội bộ)**

### Mục Đích
- Hệ thống quản lý yêu cầu mua sắm nội bộ cho ngân hàng
- Hỗ trợ workflow phê duyệt đa cấp (Camunda BPMN)
- Xuất báo cáo tài chính (Jasper Reports)
- Quản lý người dùng tập trung (Keycloak)

### Tech Stack
| Layer        | Technology                     |
|--------------|--------------------------------|
| Frontend     | Angular, SCSS, TailwindCSS     |
| Backend      | Java 21, Spring Boot 3.3       |
| Security     | Spring Security, Keycloak 24   |
| Database     | PostgreSQL 16                  |
| Cache        | Redis 7                        |
| Messaging    | Apache Kafka 3.7 (KRaft)       |
| Workflow     | Camunda BPMN 7                 |
| Reports      | Jasper Reports 7               |
| Logging      | Log4j2 + OpenTelemetry         |
| Container    | Docker, Docker Compose         |
| ORM          | Spring Data JPA, Hibernate     |
| Mapper       | MapStruct 1.5.5                |

### Service Ports
| Service        | Port | Purpose                      |
|---|---|---|
| Frontend       | 80   | Angular UI                   |
| API Gateway    | 8000 | Request routing & rate limit |
| Auth Service   | 8081 | Authentication & token mgmt  |
| Domain Service | 8082 | Business logic & reports     |
| Keycloak       | 8080 | SSO & user provider          |
| PostgreSQL     | 5432 | Primary database             |
| Redis          | 6379 | Cache & session store        |
| Kafka          | 9092 | Event messaging              |

---

## 🏗️ II. KIẾN TRÚC BACKEND

### Clean Architecture (Bắt Buộc)
```
Dependency Direction: Infrastructure → Application → Domain
                      (Outer)          (Middle)    (Inner/Core)

KHÔNG bao giờ để Domain phụ thuộc vào Application hoặc Infrastructure
```

### Cấu Trúc Thư Mục Chuẩn

```
service-name/
├── Dockerfile                 # Với JVM tuning + OpenTelemetry agent
├── pom.xml                   # Maven config
├── src/
│   ├── main/
│   │   ├── java/com/adminportal/servicename/
│   │   │   ├── application/               # Application Layer
│   │   │   │   ├── controllers/           # REST endpoints
│   │   │   │   ├── dtos/                  # Request/Response DTOs
│   │   │   │   ├── mappers/               # MapStruct interfaces
│   │   │   │   ├── services/              # Application services
│   │   │   │   ├── usecases/              # Use case implementations
│   │   │   │   └── events/                # Application events
│   │   │   │
│   │   │   ├── domain/                    # Domain Layer (Core Business)
│   │   │   │   ├── entities/              # Domain entities (JPA)
│   │   │   │   ├── repositories/          # Repository interfaces
│   │   │   │   ├── exceptions/            # Domain exceptions
│   │   │   │   ├── specifications/        # JPA Specifications
│   │   │   │   ├── enums/                 # Domain enumerations
│   │   │   │   └── valueobjects/          # Value objects
│   │   │   │
│   │   │   └── infrastructure/            # Infrastructure Layer
│   │   │       ├── config/                # Spring configs
│   │   │       ├── persistence/           # JPA implementations
│   │   │       ├── external/              # External integrations
│   │   │       │   ├── keycloak/
│   │   │       │   ├── kafka/
│   │   │       │   ├── redis/
│   │   │       │   └── mail/
│   │   │       ├── security/              # Security filters, interceptors
│   │   │       ├── encryption/            # AES-GCM encryption
│   │   │       └── cache/                 # Cache implementation
│   │   │
│   │   └── resources/
│   │       ├── application.yml            # Default config
│   │       ├── application-docker.yml     # Docker profile
│   │       ├── application-dev.yml        # Dev profile
│   │       ├── log4j2/                    # Logging config
│   │       │   └── log4j2.xml
│   │       ├── db/
│   │       │   └── migration/             # Flyway migrations
│   │       └── messages/                  # i18n messages
│   │
│   └── test/
│       └── java/com/adminportal/servicename/
│           ├── application/               # App layer tests
│           ├── domain/                    # Domain logic tests
│           └── infrastructure/            # Integration tests
│
└── target/                   # Build output (ignore in git)
```

### Dependency Injection Principles
- Luôn inject **interface**, KHÔNG inject **implementation class**
- Sử dụng `@Service`, `@Repository`, `@Component` để auto-wire
- Configuration classes cho external dependencies

---

## 🔐 III. BẢECURITY - CORE REQUIREMENTS

### 1️⃣ User Management - Custom Database

#### ❌ KHÔNG làm
- KHÔNG dùng Keycloak DB để lưu user
- KHÔNG hardcode user info

#### ✅ PHẢI làm
- Tự tạo table `users` trong PostgreSQL chính
- Schema:
```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,           -- bcrypt
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url VARCHAR(500),
    phone_number VARCHAR(20),
    department_id BIGINT REFERENCES departments,
    is_active BOOLEAN DEFAULT true,
    is_email_verified BOOLEAN DEFAULT false,
    is_2fa_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),                -- TOTP secret
    last_login_at TIMESTAMP,
    password_changed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    CONSTRAINT email_lowercase CHECK (email = LOWER(email)),
    CONSTRAINT username_lowercase CHECK (username = LOWER(username))
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);
```

#### Account Features (Bắt buộc)

##### 1. Register
- Input: username, email, password, first_name, last_name
- Validate: 
  - Username (3-50 chars, alphanumeric + underscore)
  - Email (valid format, unique)
  - Password (min 12 chars, uppercase, lowercase, number, special char)
- Password hashing: bcrypt (min 12 rounds)
- Send verification email (OTP link)
- Mark as `is_email_verified = false` until verified

##### 2. Login
- Input: username/email + password
- Flow:
  1. Check user exists & `is_active = true`
  2. Verify password hash
  3. Contact Keycloak custom provider để verify lần nữa (double-check)
  4. Mint JWT token
  5. Save token to DB + Redis (sync)
  6. Check 2FA enabled → if yes, return 2FA verification request
  7. Return token (or 2FA challenge if enabled)

##### 3. Logout
- Invalidate token: set `active = false` in DB
- Evict from Redis: `DEL token_key`
- Clear session cookies

##### 4. Forgot Password
- Input: email
- Validate email exists
- Generate reset token (hash + timestamp, TTL 30 mins)
- Save reset token to DB (separate table)
- Send reset link via email
- Verify token → update password
- Hash password & save
- Invalidate all active tokens

##### 5. 2FA (Two Factor Authentication)
- **Type**: TOTP (Time-based One-Time Password)
- **Tool**: Google Authenticator / Microsoft Authenticator
- **Implementation**:
  - Generate secret on enable request → show QR code
  - User scan QR → confirm with OTP
  - Save secret to DB
  - On login: if 2FA enabled, ask for OTP after password verify
  - Verify OTP: check against current TOTP

---

### 2️⃣ Authentication Flow (Auth Service)

#### Endpoint: `POST /api/v1/auth/login`
```json
// Request
{
  "username": "john.doe",
  "password": "SecurePass@123"
}

// Response (No 2FA)
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": null,
    "expiresIn": null,
    "user": {
      "id": 1,
      "username": "john.doe",
      "email": "john@example.com",
      "role": "DEPARTMENT_LEAD",
      "avatarUrl": "...",
      "departmentId": 5
    }
  },
  "timestamp": "2026-04-24T10:30:00Z"
}

// Response (2FA Required)
{
  "success": false,
  "data": {
    "challenge": "2fa_challenge_xxx",
    "method": "TOTP"
  },
  "code": "2FA_REQUIRED",
  "message": "Two-factor authentication required"
}
```

#### Token Content (JWT Payload)
```json
{
  "sub": "john.doe",
  "username": "john.doe",
  "email": "john@example.com",
  "role": "DEPARTMENT_LEAD",
  "departmentId": 5,
  "userId": 1,
  "issued_at": 1234567890,
  "exp": null,
  "jti": "unique-token-id"
}
```

#### Token Management Storage

**Database (auth_tokens table)**
```sql
CREATE TABLE auth_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users,
    token_jti VARCHAR(255) UNIQUE NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    issued_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP,                  -- NULLABLE (never expire)
    revoked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_tokens_user_active ON auth_tokens(user_id, is_active);
CREATE INDEX idx_tokens_jti ON auth_tokens(token_jti);
```

**Redis**
```
Key: "token:{jti}"
Value: {
  "userId": 1,
  "username": "john.doe",
  "isActive": true
}
TTL: None (manual evict)
```

**Sync Strategy**:
1. Save to DB → immediately
2. Save to Redis → immediately
3. Read: Check Redis first (fast), fallback DB (source of truth)
4. Revoke: DB set `is_active=false`, Redis `DEL token_key`

#### Single Session Per User
- Query DB: `SELECT * FROM auth_tokens WHERE user_id = ? AND is_active = true`
- Nếu có token cũ: set `is_active = false` + evict Redis
- Sau đó save token mới

---

### 3️⃣ RBAC (Role-Based Access Control)

#### Role & Permission Entities

```sql
-- Roles
CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

-- Example roles
INSERT INTO roles (code, name, description) VALUES
('ADMIN', 'Administrator', 'Full system access'),
('FINANCE_MANAGER', 'Finance Manager', 'Financial approvals'),
('DEPARTMENT_LEAD', 'Department Lead', 'Department head'),
('PROCUREMENT_OFFICER', 'Procurement Officer', 'Procurement tasks'),
('USER', 'Regular User', 'Basic user');

-- Permissions
CREATE TABLE permissions (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    resource VARCHAR(50),                  -- e.g. "request", "report"
    action VARCHAR(50),                    -- e.g. "create", "approve"
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

-- Example permissions
INSERT INTO permissions (code, name, resource, action) VALUES
('request.create', 'Create Request', 'request', 'create'),
('request.edit', 'Edit Request', 'request', 'edit'),
('request.approve', 'Approve Request', 'request', 'approve'),
('request.reject', 'Reject Request', 'request', 'reject'),
('report.view', 'View Reports', 'report', 'view'),
('report.export', 'Export Reports', 'report', 'export');

-- Role-Permission Mapping
CREATE TABLE role_permissions (
    role_id BIGINT NOT NULL REFERENCES roles,
    permission_id BIGINT NOT NULL REFERENCES permissions,
    PRIMARY KEY (role_id, permission_id)
);

-- User-Role Mapping
CREATE TABLE user_roles (
    user_id BIGINT NOT NULL REFERENCES users,
    role_id BIGINT NOT NULL REFERENCES roles,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by VARCHAR(50),
    PRIMARY KEY (user_id, role_id)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
```

#### Implementation in Spring Boot

**Domain Entity**:
```java
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String username;
    private String email;
    private String passwordHash;
    
    @ManyToMany
    @JoinTable(
        name = "user_roles",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles;
    
    // ... other fields
}

@Entity
@Table(name = "roles")
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String code;
    private String name;
    
    @ManyToMany
    @JoinTable(
        name = "role_permissions",
        joinColumns = @JoinColumn(name = "role_id"),
        inverseJoinColumns = @JoinColumn(name = "permission_id")
    )
    private Set<Permission> permissions;
}

@Entity
@Table(name = "permissions")
public class Permission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String code;
    private String name;
    private String resource;
    private String action;
}
```

**Authorization Annotation**:
```java
// Create custom @RequirePermission annotation
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequirePermission {
    String value();  // e.g. "request.approve"
}

// Aspect to check permission
@Aspect
@Component
public class PermissionAspect {
    @Around("@annotation(requirePermission)")
    public Object checkPermission(ProceedingJoinPoint jp, RequirePermission requirePermission) 
            throws Throwable {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String permissionCode = requirePermission.value();
        
        // Load user permissions from DB at runtime
        User user = userRepository.findByUsername(auth.getName());
        Set<String> userPermissions = user.getRoles().stream()
            .flatMap(role -> role.getPermissions().stream())
            .map(Permission::getCode)
            .collect(Collectors.toSet());
        
        if (!userPermissions.contains(permissionCode)) {
            throw new AccessDeniedException("Missing permission: " + permissionCode);
        }
        
        return jp.proceed();
    }
}

// Usage
@GetMapping("/{id}/approve")
@RequirePermission("request.approve")
public ResponseEntity<?> approveRequest(@PathVariable Long id) {
    // ... logic
}
```

#### Permission Check in Service
```java
@Service
public class PurchasingRequestService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PermissionRepository permissionRepository;
    
    public void approveRequest(Long requestId, String username) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new UserNotFoundException());
        
        // Check permission at runtime (NOT in token)
        boolean hasPermission = user.getRoles().stream()
            .flatMap(role -> role.getPermissions().stream())
            .anyMatch(p -> "request.approve".equals(p.getCode()));
        
        if (!hasPermission) {
            throw new AccessDeniedException("User does not have approve permission");
        }
        
        // Continue with business logic
        PurchasingRequest request = findRequest(requestId);
        request.setStatus(RequestStatus.APPROVED);
        // ...
    }
}
```

---

### 4️⃣ x-api-key Header Validation

**⚠️ Must check BEFORE JWT validation**

```java
@Component
public class ApiKeyFilter extends OncePerRequestFilter {
    
    @Value("${api-key}")
    private String validApiKey;
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                   HttpServletResponse response,
                                   FilterChain filterChain) throws ServletException, IOException {
        String apiKey = request.getHeader("x-api-key");
        
        // Skip health checks, health-check endpoints
        if (request.getRequestURI().contains("/health") || 
            request.getRequestURI().contains("/swagger")) {
            filterChain.doFilter(request, response);
            return;
        }
        
        if (apiKey == null || !apiKey.equals(validApiKey)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"Invalid x-api-key\"}");
            return;
        }
        
        filterChain.doFilter(request, response);
    }
}

// Register in SecurityConfig
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .addFilterBefore(apiKeyFilter(), UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
```

---

### 5️⃣ Request/Response Encryption (AES-256-GCM)

**Configuration**:
```yaml
encryption:
  algorithm: AES/GCM/NoPadding
  key-size: 256
  iv-size: 96  # bits
  tag-size: 128  # bits
  secret: ${ENCRYPT_SECRET}  # Exactly 32 chars
```

**Encryption Service**:
```java
@Service
public class EncryptionService {
    
    private final SecretKey secretKey;
    private final String ALGORITHM = "AES/GCM/NoPadding";
    
    public EncryptionService(@Value("${encryption.secret}") String secret) {
        byte[] decodedKey = Base64.getDecoder().decode(secret);
        this.secretKey = new SecretKeySpec(decodedKey, 0, decodedKey.length, 0, "AES");
    }
    
    public EncryptedData encrypt(String plaintext) throws Exception {
        Cipher cipher = Cipher.getInstance(ALGORITHM);
        byte[] iv = generateRandomBytes(12);  // 96-bit IV
        GCMParameterSpec spec = new GCMParameterSpec(128, iv);  // 128-bit tag
        
        cipher.init(Cipher.ENCRYPT_MODE, secretKey, spec);
        byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
        
        return new EncryptedData(
            Base64.getEncoder().encodeToString(ciphertext),
            Base64.getEncoder().encodeToString(iv)
        );
    }
    
    public String decrypt(String ciphertext, String iv) throws Exception {
        Cipher cipher = Cipher.getInstance(ALGORITHM);
        byte[] decodedCiphertext = Base64.getDecoder().decode(ciphertext);
        byte[] decodedIv = Base64.getDecoder().decode(iv);
        
        GCMParameterSpec spec = new GCMParameterSpec(128, decodedIv);
        cipher.init(Cipher.DECRYPT_MODE, secretKey, spec);
        
        byte[] plaintext = cipher.doFinal(decodedCiphertext);
        return new String(plaintext, StandardCharsets.UTF_8);
    }
    
    private byte[] generateRandomBytes(int size) {
        byte[] iv = new byte[size];
        new SecureRandom().nextBytes(iv);
        return iv;
    }
}

@Data
public class EncryptedData {
    private String data;
    private String iv;
}
```

**Request/Response Wrapper**:
```java
@Component
public class EncryptionInterceptor implements HandlerInterceptor {
    
    @Autowired
    private EncryptionService encryptionService;
    
    @Override
    public boolean preHandle(HttpServletRequest request, 
                            HttpServletResponse response,
                            Object handler) throws Exception {
        // Store encrypted body for later processing
        return true;
    }
}

// AOP để encrypt response
@Aspect
@Component
public class ResponseEncryptionAspect {
    
    @Autowired
    private EncryptionService encryptionService;
    
    @Around("@annotation(com.adminportal.auth.infrastructure.security.Encrypted)")
    public ResponseEntity<?> encryptResponse(ProceedingJoinPoint pjp) throws Throwable {
        ResponseEntity<?> response = (ResponseEntity<?>) pjp.proceed();
        
        String json = objectMapper.writeValueAsString(response.getBody());
        EncryptedData encrypted = encryptionService.encrypt(json);
        
        return ResponseEntity.ok()
            .body(new EncryptedPayload(encrypted.getData(), encrypted.getIv()));
    }
}
```

---

### 6️⃣ Idempotency Prevention

**Idempotency Key Header**:
```
POST /api/v1/requests
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
```

**Implementation**:
```java
@Service
public class IdempotencyService {
    
    @Autowired
    private IdempotencyRepository idempotencyRepository;
    
    public <T> T executeIdempotent(String idempotencyKey, Callable<T> operation) {
        // Check if request already processed
        Optional<IdempotencyRecord> existing = 
            idempotencyRepository.findByIdempotencyKey(idempotencyKey);
        
        if (existing.isPresent()) {
            return objectMapper.convertValue(
                existing.get().getResponse(), 
                (JavaType) operation.getClass()
            );
        }
        
        // Execute operation
        T result = operation.call();
        
        // Save for future requests
        IdempotencyRecord record = new IdempotencyRecord(
            idempotencyKey,
            objectMapper.convertValue(result, JsonNode.class),
            LocalDateTime.now().plusHours(24)
        );
        idempotencyRepository.save(record);
        
        return result;
    }
}

// Controller usage
@PostMapping("/requests")
public ResponseEntity<?> createRequest(
        @RequestHeader("Idempotency-Key") String idempotencyKey,
        @RequestBody CreateRequestDto dto) {
    
    return idempotencyService.executeIdempotent(idempotencyKey, () -> {
        PurchasingRequest request = requestService.create(dto);
        return ResponseEntity.status(201).body(request);
    });
}
```

---

## 📊 IV. LOGGING & MONITORING

### 1. Log4j2 Configuration (Remove Logback)

**Step 1: POM.xml**
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
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

<!-- OpenTelemetry -->
<dependency>
    <groupId>io.opentelemetry</groupId>
    <artifactId>opentelemetry-api</artifactId>
</dependency>
<dependency>
    <groupId>io.opentelemetry.instrumentation</groupId>
    <artifactId>opentelemetry-instrumentation-annotations</artifactId>
</dependency>
```

**Step 2: Create `src/main/resources/log4j2/log4j2.xml`**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Configuration packages="com.adminportal.auth.infrastructure.logging">
    <Properties>
        <Property name="LOG_DIR">logs</Property>
        <Property name="LOG_PATTERN">%d{ISO8601} [%X{traceId}/%X{spanId}] [%thread] %-5level %logger{36} - %msg%n</Property>
        <Property name="LOG_MAX_SIZE">10MB</Property>
        <Property name="LOG_MAX_BACKUPS">10</Property>
    </Properties>

    <Appenders>
        <!-- Console Appender -->
        <Console name="ConsoleAppender" target="SYSTEM_OUT">
            <PatternLayout pattern="${LOG_PATTERN}"/>
        </Console>

        <!-- File Appender (Rolling) -->
        <RollingFile name="FileAppender"
                     fileName="${LOG_DIR}/app.log"
                     filePattern="${LOG_DIR}/app-%d{yyyy-MM-dd}-%i.log">
            <PatternLayout pattern="${LOG_PATTERN}"/>
            <Policies>
                <SizeBasedTriggeringPolicy size="${LOG_MAX_SIZE}"/>
                <TimeBasedTriggeringPolicy interval="1" modulate="true"/>
            </Policies>
            <DefaultRolloverStrategy max="${LOG_MAX_BACKUPS}"/>
        </RollingFile>

        <!-- Error File Appender -->
        <RollingFile name="ErrorAppender"
                     fileName="${LOG_DIR}/error.log"
                     filePattern="${LOG_DIR}/error-%d{yyyy-MM-dd}-%i.log">
            <PatternLayout pattern="${LOG_PATTERN}"/>
            <Filters>
                <ThresholdFilter level="ERROR" onMatch="ACCEPT" onMismatch="DENY"/>
            </Filters>
            <Policies>
                <SizeBasedTriggeringPolicy size="${LOG_MAX_SIZE}"/>
                <TimeBasedTriggeringPolicy interval="1" modulate="true"/>
            </Policies>
            <DefaultRolloverStrategy max="20"/>
        </RollingFile>

        <!-- Async Appender for performance -->
        <Async name="AsyncFileAppender">
            <AppenderRef ref="FileAppender"/>
        </Async>
    </Appenders>

    <Loggers>
        <!-- Application loggers -->
        <Logger name="com.adminportal" level="DEBUG"/>
        <Logger name="com.adminportal.auth.infrastructure" level="DEBUG"/>
        
        <!-- Spring loggers -->
        <Logger name="org.springframework" level="INFO"/>
        <Logger name="org.springframework.security" level="DEBUG"/>
        <Logger name="org.springframework.web" level="DEBUG"/>
        
        <!-- External loggers -->
        <Logger name="org.hibernate" level="WARN"/>
        <Logger name="org.hibernate.SQL" level="DEBUG"/>
        <Logger name="org.hibernate.type.descriptor.sql.BasicBinder" level="TRACE"/>
        <Logger name="org.apache.kafka" level="WARN"/>
        <Logger name="io.opentelemetry" level="INFO"/>
        
        <!-- Root logger -->
        <Root level="INFO">
            <AppenderRef ref="ConsoleAppender"/>
            <AppenderRef ref="AsyncFileAppender"/>
            <AppenderRef ref="ErrorAppender"/>
        </Root>
    </Loggers>
</Configuration>
```

### 2. OpenTelemetry Integration

**Dockerfile Enhancement**:
```dockerfile
FROM openjdk:21-slim

# Download OpenTelemetry Agent
RUN curl -L https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/latest/download/opentelemetry-javaagent.jar \
    -o /app/otel-javaagent.jar

# Copy application
COPY target/*.jar app.jar

# JVM Arguments with OpenTelemetry
ENV JAVA_OPTS="\
    -javaagent:/app/otel-javaagent.jar \
    -Dotel.service.name=${OTEL_SERVICE_NAME} \
    -Dotel.exporter.otlp.endpoint=${OTEL_EXPORTER_ENDPOINT} \
    -Dotel.exporter.otlp.protocol=grpc \
    -XX:+UseG1GC \
    -XX:MaxGCPauseMillis=200 \
    -XX:+UnlockExperimentalVMOptions \
    -XX:G1NewCollectionHeuristicPercent=30 \
    -XX:G1ReservePercent=10 \
    -XX:InitiatingHeapOccupancyPercent=35 \
    -XX:+ParallelRefProcEnabled \
    -XX:+AlwaysPreTouch"

ENTRYPOINT ["java", "-jar", "app.jar"]
```

**MDC (Mapped Diagnostic Context) Setup**:
```java
@Component
public class TraceLoggingFilter extends OncePerRequestFilter {
    
    private static final String TRACE_ID = "traceId";
    private static final String SPAN_ID = "spanId";
    
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                   HttpServletResponse response,
                                   FilterChain filterChain) throws ServletException, IOException {
        try {
            // Get or generate trace ID
            String traceId = request.getHeader("X-Trace-Id");
            if (traceId == null) {
                traceId = UUID.randomUUID().toString();
            }
            
            String spanId = UUID.randomUUID().toString().substring(0, 16);
            
            // Put in MDC for logging
            MDC.put(TRACE_ID, traceId);
            MDC.put(SPAN_ID, spanId);
            
            // Add to response header
            response.addHeader("X-Trace-Id", traceId);
            
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove(TRACE_ID);
            MDC.remove(SPAN_ID);
        }
    }
}
```

---

## 🐳 V. DOCKER & DEPLOYMENT

### Resource Limits (Bắt Buộc)

```yaml
deploy:
  resources:
    limits:
      cpus: "X.X"
      memory: YYYMb
    reservations:
      cpus: "A.A"
      memory: ZZZMb
```

**Khuyến nghị**:
```yaml
# docker-compose.yml services

postgres:
  deploy:
    resources:
      limits:
        cpus: "1.0"
        memory: 512M
      reservations:
        cpus: "0.5"
        memory: 256M

redis:
  deploy:
    resources:
      limits:
        cpus: "0.5"
        memory: 256M
      reservations:
        cpus: "0.25"
        memory: 128M

kafka:
  deploy:
    resources:
      limits:
        cpus: "1.0"
        memory: 768M
      reservations:
        cpus: "0.5"
        memory: 512M

keycloak:
  deploy:
    resources:
      limits:
        cpus: "1.5"
        memory: 1G
      reservations:
        cpus: "1.0"
        memory: 512M

auth-service:
  deploy:
    resources:
      limits:
        cpus: "1.0"
        memory: 512M
      reservations:
        cpus: "0.5"
        memory: 256M

domain-service:
  deploy:
    resources:
      limits:
        cpus: "1.0"
        memory: 512M
      reservations:
        cpus: "0.5"
        memory: 256M

gateway-service:
  deploy:
    resources:
      limits:
        cpus: "0.5"
        memory: 256M
      reservations:
        cpus: "0.25"
        memory: 128M
```

### Spring Boot Profiles

**application.yml**:
```yaml
spring:
  application:
    name: auth-service
  profiles:
    active: ${SPRING_PROFILES_ACTIVE:dev}
```

**application-dev.yml**:
```yaml
server:
  port: 8081
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/adminportal
    username: portaluser
    password: changeme
  redis:
    host: localhost
    port: 6379
```

**application-docker.yml**:
```yaml
server:
  port: 8081
spring:
  datasource:
    url: ${DB_URL}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
  redis:
    host: ${REDIS_HOST}
    port: ${REDIS_PORT}
    password: ${REDIS_PASSWORD}
```

### Environment Variables (`.env`)

```bash
# Spring Profile
SPRING_PROFILES_ACTIVE=docker

# Database
POSTGRES_DB=adminportal
POSTGRES_USER=portaluser
POSTGRES_PASSWORD=<STRONG_PASSWORD_MIN_20_CHARS>

# Redis
REDIS_PASSWORD=<REDIS_PASSWORD_MIN_16_CHARS>

# Kafka
KAFKA_CLUSTER_ID=MkU3OEVBNTcwNTJENDM2Qg

# Keycloak
KC_ADMIN=admin
KC_ADMIN_PASSWORD=<STRONG_PASSWORD>
KC_REALM=adminportal
KC_CLIENT_ID=auth-service
KC_CLIENT_SECRET=<CLIENT_SECRET_MIN_20_CHARS>

# JWT Token (min 32 chars - use openssl rand -base64 32)
TOKEN_SECRET=<MIN_32_CHARS_RANDOM_STRING>

# AES Encryption (exactly 32 chars for AES-256)
ENCRYPT_SECRET=<EXACTLY_32_CHARS_RANDOM_STRING>

# x-api-key (min 32 chars)
API_KEY=<MIN_32_CHARS_API_KEY>

# Email Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=noreply@yourdomain.com
MAIL_PASSWORD=<APP_SPECIFIC_PASSWORD>

# OpenTelemetry
OTEL_SERVICE_NAME=auth-service
OTEL_EXPORTER_ENDPOINT=http://localhost:4317  # or actual collector endpoint
```

---

## 💼 VI. BUSINESS LOGIC (Purchasing Request)

### Domain Model

```java
@Entity
@Table(name = "purchasing_requests")
public class PurchasingRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String requestNumber;  // AUTO-GENERATED: PR-2026-001, PR-2026-002
    private String title;
    private String description;
    
    @ManyToOne
    @JoinColumn(name = "requested_by_id")
    private User requestedBy;
    
    private LocalDateTime requestedDate;
    
    @Enumerated(EnumType.STRING)
    private RequestStatus status;  // DRAFT, PENDING, APPROVED, REJECTED, COMPLETED
    
    @OneToMany(mappedBy = "request", cascade = CascadeType.ALL)
    private Set<PurchaseItem> items;
    
    private BigDecimal totalAmount;
    private String currency;  // USD, VND
    
    private Long departmentId;
    private String costCenter;
    
    @OneToMany(mappedBy = "request")
    private List<ApprovalStep> approvalChain;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

@Entity
@Table(name = "purchase_items")
public class PurchaseItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "request_id")
    private PurchasingRequest request;
    
    private String itemCode;
    private String itemName;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;
    private String currency;
    
    private String specification;
    private String remarks;
}

@Entity
@Table(name = "approval_steps")
public class ApprovalStep {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "request_id")
    private PurchasingRequest request;
    
    private Integer stepNumber;
    
    @ManyToOne
    @JoinColumn(name = "approver_role_id")
    private Role approverRole;
    
    @ManyToOne
    @JoinColumn(name = "approver_user_id")
    private User approverUser;
    
    @Enumerated(EnumType.STRING)
    private ApprovalStatus status;  // PENDING, APPROVED, REJECTED
    
    private String remarks;
    private LocalDateTime approvedAt;
    private LocalDateTime createdAt;
}
```

### Workflow (Camunda BPMN)

**BPMN Process**:
```
[Start] 
  ↓
[User Submit Request]
  ↓
[Department Lead Review] ← PARALLEL
  ├→ [Approved?] ──Yes──→ Continue
  └→ [Rejected?] ──Yes──→ [Return to Requester] → [Notification]
  ↓
[Finance Review] ← PARALLEL
  ├→ [Approved?] ──Yes──→ Continue
  └→ [Rejected?] ──Yes──→ [End - Rejected]
  ↓
[Procurement Process]
  ├→ [Order Placed]
  ├→ [Goods Received]
  └→ [Invoice Matched]
  ↓
[Complete]
```

---

## 📝 VII. CODING STANDARDS

### 1. Object Mapper (MapStruct)

**KHÔNG dùng ModelMapper** → Sử dụng **MapStruct**

```java
// POM
<dependency>
    <groupId>org.mapstruct</groupId>
    <artifactId>mapstruct</artifactId>
    <version>1.5.5.Final</version>
</dependency>
<dependency>
    <groupId>org.mapstruct</groupId>
    <artifactId>mapstruct-processor</artifactId>
    <version>1.5.5.Final</version>
    <scope>provided</scope>
</dependency>

// Mapper Interface
@Mapper(componentModel = "spring")
public interface UserMapper {
    UserDto toDto(User user);
    
    User toEntity(CreateUserDto dto);
    
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    void updateEntity(UpdateUserDto dto, @MappingTarget User user);
}

// Usage
@Service
public class UserService {
    
    @Autowired
    private UserMapper userMapper;
    
    public UserDto getUser(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new UserNotFoundException());
        return userMapper.toDto(user);
    }
}
```

### 2. Exception Handling

```java
// Custom Exceptions
public class BusinessException extends RuntimeException {
    private String code;
    private String details;
    
    public BusinessException(String code, String message, String details) {
        super(message);
        this.code = code;
        this.details = details;
    }
}

public class UserNotFoundException extends BusinessException {
    public UserNotFoundException(Long id) {
        super("USER_NOT_FOUND", "User not found", "ID: " + id);
    }
}

// Global Exception Handler
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<?> handleBusinessException(BusinessException ex) {
        ErrorResponse error = new ErrorResponse(
            ex.getCode(),
            ex.getMessage(),
            ex.getDetails(),
            LocalDateTime.now()
        );
        return ResponseEntity.badRequest().body(error);
    }
    
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<?> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(new ErrorResponse("ACCESS_DENIED", ex.getMessage(), null, LocalDateTime.now()));
    }
}
```

### 3. Validation

```java
// At Controller layer
@PostMapping
public ResponseEntity<?> createRequest(@Valid @RequestBody CreateRequestDto dto) {
    // Input validation done by @Valid
    PurchasingRequest request = requestService.create(dto);
    return ResponseEntity.status(201).body(request);
}

// DTO with validation
@Data
public class CreateRequestDto {
    @NotBlank(message = "Title is required")
    @Size(min = 5, max = 200, message = "Title must be 5-200 chars")
    private String title;
    
    @NotBlank(message = "Description is required")
    @Size(min = 10, max = 2000)
    private String description;
    
    @NotEmpty(message = "Items cannot be empty")
    private List<PurchaseItemDto> items;
    
    @NotNull
    @Valid
    private List<PurchaseItemDto> purchaseItems;
}

// At Service layer (business validation)
@Service
public class PurchasingRequestService {
    
    public PurchasingRequest create(CreateRequestDto dto) {
        // Business validation
        if (dto.getItems().isEmpty()) {
            throw new BusinessException("EMPTY_ITEMS", "Request must have at least 1 item", null);
        }
        
        BigDecimal total = dto.getItems().stream()
            .map(item -> item.getTotalPrice())
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        if (total.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("INVALID_AMOUNT", "Total amount must be > 0", null);
        }
        
        // Continue logic
    }
}
```

### 4. Dependency Injection Best Practices

```java
// ✅ Good - Inject interface
@Service
public class OrderService {
    private final UserRepository userRepository;
    
    @Autowired
    public OrderService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
}

// ❌ Bad - Inject implementation class
@Service
public class OrderService {
    @Autowired
    private UserRepositoryImpl userRepository;
}
```

---

## ✅ VIII. IMPLEMENTATION CHECKLIST

### Auth Service
- [ ] User table + migrations
- [ ] Register endpoint + validation
- [ ] Login flow (username/password + Keycloak verify)
- [ ] Token management (DB + Redis sync)
- [ ] Single session per user logic
- [ ] Logout endpoint
- [ ] RBAC system (roles + permissions)
- [ ] 2FA implementation (TOTP)
- [ ] Forgot password flow
- [ ] x-api-key validation
- [ ] Request/Response encryption (AES-GCM)
- [ ] Idempotency check
- [ ] Custom Log4j2 configuration
- [ ] OpenTelemetry integration
- [ ] Unit tests (min 80% coverage)
- [ ] Integration tests with TestContainers

### Domain Service (Purchasing Request)
- [ ] PurchasingRequest entity + repository
- [ ] PurchaseItem entity + repository
- [ ] ApprovalStep entity + repository
- [ ] Workflow API (Camunda BPMN integration)
- [ ] Request CRUD operations
- [ ] Approval chain logic
- [ ] Jasper Reports integration
- [ ] Kafka event publishing (request events)
- [ ] Custom Log4j2 configuration
- [ ] OpenTelemetry integration
- [ ] Unit tests
- [ ] Integration tests

### Gateway Service
- [ ] API routing (Spring Cloud Gateway / custom)
- [ ] Rate limiting (per user, per IP)
- [ ] Authentication filter
- [ ] Request logging
- [ ] Response transformation
- [ ] Custom Log4j2 configuration
- [ ] Health checks

### Frontend (Angular)
- [ ] Auth module (login, register, 2FA)
- [ ] Dashboard component
- [ ] Purchasing request form (create, edit)
- [ ] Request list with filtering
- [ ] Approval workflow UI
- [ ] Reports viewer
- [ ] User profile management
- [ ] Session timeout handling

### DevOps & Docker
- [ ] Dockerfile for each service (with resource limits)
- [ ] docker-compose.yml (with all resource limits)
- [ ] Health checks for all services
- [ ] Environment variables setup
- [ ] Logging aggregation setup
- [ ] Network configuration
- [ ] Volume management

---

## 📞 IX. Response Format Standards

### Success Response
```json
{
  "success": true,
  "code": "SUCCESS",
  "data": {
    // Actual data
  },
  "timestamp": "2026-04-24T10:30:00Z",
  "version": "1.0"
}
```

### Error Response
```json
{
  "success": false,
  "code": "ERROR_CODE",
  "message": "Error message",
  "details": "Additional details if any",
  "timestamp": "2026-04-24T10:30:00Z",
  "errors": [
    {
      "field": "username",
      "message": "Username is required"
    }
  ]
}
```

### Pagination Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalElements": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

---

## 🔗 References

- [Spring Boot 3.3 Docs](https://spring.io/projects/spring-boot)
- [Spring Security 6.x](https://spring.io/projects/spring-security)
- [MapStruct Documentation](https://mapstruct.org)
- [Camunda BPMN 7](https://camunda.com/bpmn/)
- [Log4j2 Configuration](https://logging.apache.org/log4j/2.x/index.html)
- [OpenTelemetry Java](https://opentelemetry.io/docs/instrumentation/java/)
- [PostgreSQL 16](https://www.postgresql.org/docs/16/)
- [Redis 7](https://redis.io/docs/)

---

**Last Updated**: 24/04/2026  
**Version**: 1.0  
**Status**: In Development
