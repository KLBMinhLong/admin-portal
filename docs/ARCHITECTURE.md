# System Architecture - Purchasing Request Portal

**Visual Architecture Overview**

---

## 📐 High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
│  ┌──────────────────────┐                                           │
│  │   Angular Frontend   │  (Port 80)                               │
│  │  - Authentication    │                                           │
│  │  - Request Management│                                           │
│  │  - Approval Workflow │                                           │
│  │  - Reports           │                                           │
│  └──────────────────────┘                                           │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
                            x-api-key + JWT
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                       GATEWAY LAYER                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │         API Gateway Service (Port 8000)                      │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │ Filters:                                               │ │  │
│  │  │ 1. x-api-key validation (FIRST)                       │ │  │
│  │  │ 2. JWT authentication                                  │ │  │
│  │  │ 3. Request logging & tracing                           │ │  │
│  │  │ 4. Rate limiting (per user, per IP)                    │ │  │
│  │  │ 5. Request transformation (decrypt)                    │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │ Router → Auth Service (8081) or Domain Service (8082)       │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
              ↓                                    ↓
     ┌─────────────────────┐          ┌─────────────────────┐
     │  AUTH SERVICE       │          │ DOMAIN SERVICE      │
     │  (Port 8081)        │          │ (Port 8082)         │
     └─────────────────────┘          └─────────────────────┘
              ↓                                    ↓
```

---

## 🔐 Authentication & Authorization Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   LOGIN FLOW                                      │
└─────────────────────────────────────────────────────────────────┘

Client Request:
POST /api/v1/auth/login
{
  "username": "john.doe",
  "password": "SecurePass@123"
}

                            ↓

[1] Receive Credentials
    ↓
[2] Validate format & check user exists
    ↓
[3] Contact Keycloak (custom provider)
    Keycloak verifies with external system
    ↓
[4] If 2FA enabled:
    ├→ Generate OTP challenge
    ├→ Save 2FA challenge to Redis (TTL: 5 mins)
    └→ Return 2FA challenge to client
    
    Client: POST /api/v1/auth/verify-2fa
    {
      "challenge": "2fa_xxx",
      "otp": "123456"
    }
    
    Backend verifies OTP against TOTP secret
    
    ↓
[5] Mint JWT Token
    Token content:
    {
      "sub": "john.doe",
      "username": "john.doe",
      "email": "john@example.com",
      "role": "DEPARTMENT_LEAD",
      "userId": 1,
      "jti": "unique-token-id"
    }
    (NO expiration, NO permissions)
    
    ↓
[6] Save Token to Database
    Table: auth_tokens
    - user_id: 1
    - token_jti: unique-token-id
    - token_hash: SHA256(token)
    - is_active: true
    - issued_at: 2026-04-24T10:30:00Z
    - expires_at: NULL
    
    ↓
[7] Cache Token in Redis
    Key: "token:unique-token-id"
    Value: {userId, username, isActive}
    TTL: None (manual evict)
    
    ↓
[8] Revoke Old Tokens (Single Session)
    Query: SELECT * FROM auth_tokens 
           WHERE user_id = 1 AND is_active = true
    
    For each old token:
    - DB: set is_active = false
    - Redis: DEL token:old-jti
    
    ↓
[9] Return Response to Client
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": 1,
        "username": "john.doe",
        "role": "DEPARTMENT_LEAD"
      }
    }
```

---

## 🔑 Token Management Lifecycle

```
         Create Token
              ↓
    ┌─────────────────────┐
    │   Database Store    │
    │  (Source of Truth)  │
    │   - is_active: T    │
    │   - issued_at: NOW  │
    │   - expires_at: NULL│
    └─────────────────────┘
              ↓ (SYNC)
    ┌─────────────────────┐
    │   Redis Cache       │
    │  (Fast Access)      │
    │  TTL: None          │
    └─────────────────────┘
              ↓
        Use Token
     (Check Redis first,
      fallback to DB)
              ↓
        Valid? ✓
              ↓
   Load User Permissions
   from DB at Runtime
   (NOT from token)
              ↓
       Execute Logic
              ↓
    ┌──────────────┐
    │  Logout/     │
    │  Revoke      │
    └──────────────┘
         ↓
    DB: is_active = false
    Redis: DEL token_key
```

---

## 🏗️ Service Architecture (Clean Architecture)

### Auth Service Structure
```
auth-service/
├── application/
│   ├── controllers/
│   │   └── AuthController.java
│   │       ├── POST /api/v1/auth/register
│   │       ├── POST /api/v1/auth/login
│   │       ├── POST /api/v1/auth/logout
│   │       ├── POST /api/v1/auth/forgot-password
│   │       ├── POST /api/v1/auth/verify-2fa
│   │       └── POST /api/v1/auth/enable-2fa
│   │
│   ├── dtos/
│   │   ├── LoginRequest.java
│   │   ├── LoginResponse.java
│   │   ├── RegisterRequest.java
│   │   ├── UserDto.java
│   │   └── ...
│   │
│   ├── services/
│   │   ├── AuthApplicationService.java
│   │   │   ├── login()
│   │   │   ├── register()
│   │   │   └── logout()
│   │   └── TokenService.java
│   │       ├── generateToken()
│   │       ├── validateToken()
│   │       └── revokeToken()
│   │
│   ├── mappers/
│   │   ├── UserMapper.java
│   │   └── AuthTokenMapper.java
│   │
│   └── events/
│       ├── UserRegisteredEvent.java
│       └── UserLoggedInEvent.java
│
├── domain/
│   ├── entities/
│   │   ├── User.java
│   │   ├── AuthToken.java
│   │   ├── Role.java
│   │   ├── Permission.java
│   │   └── ...
│   │
│   ├── repositories/ (Interfaces only)
│   │   ├── UserRepository.java
│   │   ├── AuthTokenRepository.java
│   │   ├── RoleRepository.java
│   │   └── PermissionRepository.java
│   │
│   ├── exceptions/
│   │   ├── UserNotFoundException.java
│   │   ├── InvalidCredentialsException.java
│   │   ├── TokenRevokedException.java
│   │   └── ...
│   │
│   └── enums/
│       ├── TokenStatus.java
│       └── RequestStatus.java
│
└── infrastructure/
    ├── config/
    │   ├── SecurityConfig.java
    │   ├── JwtProperties.java
    │   └── EncryptionConfig.java
    │
    ├── persistence/
    │   ├── JpaUserRepository.java
    │   ├── JpaAuthTokenRepository.java
    │   └── ...
    │
    ├── external/
    │   ├── keycloak/
    │   │   ├── KeycloakProvider.java
    │   │   ├── KeycloakConfig.java
    │   │   └── KeycloakClient.java
    │   │
    │   ├── kafka/
    │   │   ├── AuthEventProducer.java
    │   │   └── KafkaProperties.java
    │   │
    │   ├── redis/
    │   │   ├── RedisTokenCache.java
    │   │   └── RedisConfig.java
    │   │
    │   ├── mail/
    │   │   ├── EmailService.java
    │   │   └── MailConfig.java
    │   │
    │   └── otp/
    │       ├── TOTPProvider.java (Google Authenticator)
    │       └── OTPService.java
    │
    ├── security/
    │   ├── ApiKeyFilter.java (Check x-api-key FIRST)
    │   ├── JwtAuthenticationFilter.java
    │   ├── JwtProvider.java
    │   └── EncryptionInterceptor.java
    │
    ├── encryption/
    │   ├── AesGcmEncryptionService.java (AES-256-GCM)
    │   ├── EncryptionKey.java
    │   └── EncryptedPayload.java
    │
    └── cache/
        ├── TokenCacheService.java
        └── IdempotencyService.java
```

---

## 💾 Database Schema (Key Tables)

```
┌──────────────────────────────────────┐
│           USERS TABLE                │
├──────────────────────────────────────┤
│ id (PK)                              │
│ username (UNIQUE)                    │
│ email (UNIQUE, LOWERCASE)            │
│ password_hash (bcrypt)               │
│ first_name, last_name                │
│ department_id (FK)                   │
│ is_active (default: true)            │
│ is_email_verified (default: false)   │
│ is_2fa_enabled (default: false)      │
│ two_factor_secret (encrypted)        │
│ last_login_at                        │
│ created_at, updated_at               │
└──────────────────────────────────────┘
           ↕ (FK)
┌──────────────────────────────────────┐
│       USER_ROLES TABLE               │
├──────────────────────────────────────┤
│ user_id (FK)                         │
│ role_id (FK)                         │
└──────────────────────────────────────┘
           ↕ (FK)
┌──────────────────────────────────────┐
│         ROLES TABLE                  │
├──────────────────────────────────────┤
│ id (PK)                              │
│ code (UNIQUE)                        │
│ name                                 │
│ description                          │
│ is_active                            │
└──────────────────────────────────────┘
           ↕ (FK)
┌──────────────────────────────────────┐
│   ROLE_PERMISSIONS TABLE             │
├──────────────────────────────────────┤
│ role_id (FK)                         │
│ permission_id (FK)                   │
└──────────────────────────────────────┘
           ↕ (FK)
┌──────────────────────────────────────┐
│      PERMISSIONS TABLE               │
├──────────────────────────────────────┤
│ id (PK)                              │
│ code (UNIQUE)                        │
│ name                                 │
│ resource                             │
│ action                               │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│       AUTH_TOKENS TABLE              │
├──────────────────────────────────────┤
│ id (PK)                              │
│ user_id (FK) [INDEX]                 │
│ token_jti (UNIQUE) [INDEX]           │
│ token_hash (SHA256)                  │
│ ip_address                           │
│ user_agent                           │
│ is_active (default: true) [INDEX]    │
│ issued_at (NOT NULL)                 │
│ expires_at (NULL = never expire)     │
│ revoked_at                           │
│ created_at                           │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│    PURCHASING_REQUESTS TABLE         │
├──────────────────────────────────────┤
│ id (PK)                              │
│ request_number (UNIQUE, AUTO)        │
│ title                                │
│ description                          │
│ requested_by_id (FK)                 │
│ requested_date                       │
│ status (ENUM) [INDEX]                │
│ total_amount (DECIMAL)               │
│ currency                             │
│ department_id (FK)                   │
│ cost_center                          │
│ created_at, updated_at               │
└──────────────────────────────────────┘
           ↕ (FK)
┌──────────────────────────────────────┐
│      PURCHASE_ITEMS TABLE            │
├──────────────────────────────────────┤
│ id (PK)                              │
│ request_id (FK)                      │
│ item_code                            │
│ item_name                            │
│ quantity                             │
│ unit_price (DECIMAL)                 │
│ total_price (DECIMAL)                │
│ specification                        │
└──────────────────────────────────────┘
           ↕ (FK)
┌──────────────────────────────────────┐
│       APPROVAL_STEPS TABLE           │
├──────────────────────────────────────┤
│ id (PK)                              │
│ request_id (FK)                      │
│ step_number                          │
│ approver_role_id (FK)                │
│ approver_user_id (FK)                │
│ status (ENUM)                        │
│ remarks                              │
│ approved_at                          │
│ created_at                           │
└──────────────────────────────────────┘
```

---

## 🚀 Deployment Architecture

```
┌────────────────────────────────────────────────────────────┐
│              Docker Compose Network                         │
│             (portal-net bridge network)                     │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  PostgreSQL  │  │    Redis     │  │    Kafka     │    │
│  │  16-alpine   │  │   7-alpine   │  │     7.6      │    │
│  │  Port: 5432  │  │ Port: 6379   │  │ Port: 9092   │    │
│  │   512M RAM   │  │   256M RAM   │  │   768M RAM   │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│         ↑                                      ↑            │
│         │                                      │            │
│         └──────────────┬───────────────────────┘            │
│                        │                                    │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │        Keycloak 24 (Port: 8080)             │  │  │
│  │  │        (Uses PostgreSQL schema: keycloak)   │  │  │
│  │  │        Custom Provider + 512M RAM           │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────┘  │
│         ↑                                                   │
│         │                                                   │
│  ┌──────────────────┐  ┌──────────────────┐              │
│  │  Auth Service    │  │ Domain Service   │              │
│  │  (Port: 8081)    │  │ (Port: 8082)     │              │
│  │    512M RAM      │  │    512M RAM      │              │
│  └──────────────────┘  └──────────────────┘              │
│         ↑                       ↑                         │
│         └───────────┬───────────┘                         │
│                     │                                     │
│  ┌──────────────────────────────────┐                    │
│  │  API Gateway Service (Port: 8000)│                    │
│  │        (256M RAM)                │                    │
│  └──────────────────────────────────┘                    │
│                     ↑                                     │
│                     │                                     │
└─────────────────────┼────────────────────────────────────┘
                      │
                 ┌────────────┐
                 │   Docker   │
                 │   Bridge   │
                 │  Network   │
                 └────────────┘
                      ↑
             ┌────────────────────┐
             │  Host Machine      │
             │  (0.0.0.0:80)      │
             │  (0.0.0.0:8000)    │
             │  (0.0.0.0:8080)    │
             └────────────────────┘
```

---

## 🔄 Request Processing Flow

```
1. Frontend Request
   ├─ Header: x-api-key: <api-key>
   ├─ Header: Authorization: Bearer <jwt-token>
   ├─ Header: Idempotency-Key: <uuid> (for POST/PUT/PATCH)
   └─ Body: Encrypted JSON payload
                     ↓
2. API Gateway (Port 8000)
   ├─ ApiKeyFilter: Validate x-api-key ✓
   ├─ JwtFilter: Validate JWT token ✓
   ├─ RateLimitFilter: Check rate limits ✓
   ├─ DecryptionInterceptor: Decrypt body ✓
   ├─ Route to Auth Service or Domain Service
   └─ Add traceId/spanId to MDC
                     ↓
3. Target Service
   ├─ Receive unencrypted request
   ├─ Controller: Validate @Valid annotations
   ├─ Service: Validate business logic
   ├─ Check permissions from DB (at runtime)
   ├─ Execute business logic
   ├─ Save to database
   ├─ Publish Kafka events
   └─ Return response object
                     ↓
4. Response Processing
   ├─ EncryptionAspect: Encrypt response
   ├─ Add traceId/spanId header
   ├─ Set CORS headers
   └─ Return to client
                     ↓
5. Frontend Receives
   ├─ Status: 200/201/400/401/403/500
   ├─ Body: Encrypted JSON
   ├─ Header: X-Trace-Id
   └─ Decrypt & Display
```

---

## 📊 Logging & Tracing

```
┌──────────────────────────────────┐
│    Log4j2 Configuration          │
├──────────────────────────────────┤
│ appenders:                       │
│ - Console                        │
│ - File (async, rolling)          │
│ - Error File (threshold: ERROR)  │
│                                  │
│ Pattern:                         │
│ [TIMESTAMP] [TRACE_ID/SPAN_ID]   │
│ [THREAD] [LEVEL] [LOGGER] - MSG  │
│                                  │
│ Include in MDC:                  │
│ - traceId                        │
│ - spanId                         │
│ - username                       │
│ - ip_address                     │
│ - user_agent                     │
└──────────────────────────────────┘
              ↓
┌──────────────────────────────────┐
│   OpenTelemetry Java Agent       │
├──────────────────────────────────┤
│ Auto-instrumentation for:        │
│ - Spring Boot                    │
│ - Spring Security                │
│ - JPA/Hibernate                  │
│ - HTTP Clients                   │
│ - Database Drivers               │
│ - Kafka                          │
│                                  │
│ Export to:                       │
│ - OTLP Collector (gRPC)          │
│ - Jaeger / DataDog / etc.        │
└──────────────────────────────────┘
```

---

## 🔐 Security Layers

```
┌────────────────────────────────────┐
│   Layer 1: API Gateway             │
│   ├─ x-api-key validation          │
│   ├─ Rate limiting                 │
│   ├─ Request decryption            │
│   └─ Request logging               │
└────────────────────────────────────┘
              ↓
┌────────────────────────────────────┐
│   Layer 2: Authentication          │
│   ├─ JWT token validation          │
│   ├─ Token DB + Redis check        │
│   ├─ Token revocation check        │
│   └─ User session verification     │
└────────────────────────────────────┘
              ↓
┌────────────────────────────────────┐
│   Layer 3: Authorization (RBAC)    │
│   ├─ Load user roles               │
│   ├─ Load role permissions (DB)    │
│   ├─ Check permission for action   │
│   └─ Audit log access              │
└────────────────────────────────────┘
              ↓
┌────────────────────────────────────┐
│   Layer 4: Input Validation        │
│   ├─ DTO @Valid annotations        │
│   ├─ Format validation             │
│   ├─ Business logic validation     │
│   └─ SQL injection prevention      │
└────────────────────────────────────┘
              ↓
┌────────────────────────────────────┐
│   Layer 5: Business Logic          │
│   ├─ Domain validation             │
│   ├─ Idempotency check             │
│   ├─ Database transaction          │
│   └─ Event publishing              │
└────────────────────────────────────┘
              ↓
┌────────────────────────────────────┐
│   Layer 6: Response Encryption     │
│   ├─ AES-256-GCM encryption        │
│   ├─ IV generation & storage       │
│   ├─ Response wrapping             │
│   └─ Client decryption             │
└────────────────────────────────────┘
```

---

**Last Updated**: 24/04/2026  
**Architecture Version**: 1.0
