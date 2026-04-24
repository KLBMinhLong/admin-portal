# DEVELOPMENT RULES & STANDARDS

**Purchasing Request Portal - Development Guidelines**

> Các quy tắc bắt buộc mà tất cả developers phải tuân thủ khi code cho dự án này.

---

## 🚫 ABSOLUTE RULES (Không được vi phạm)

### Rule 1: Clean Architecture Strict Mode
```
┌─────────────────────────────────────┐
│      INFRASTRUCTURE LAYER            │  (Outermost)
│  (Repositories, External Services)   │
├─────────────────────────────────────┤
│      APPLICATION LAYER               │  (Middle)
│  (Services, Controllers, DTOs)       │
├─────────────────────────────────────┤
│      DOMAIN LAYER                    │  (Innermost)
│  (Entities, Business Logic)          │
└─────────────────────────────────────┘

✅ CORRECT:   Infrastructure → Application → Domain
❌ WRONG:     Domain → Application → Infrastructure
```

**Consequence**: Code review will REJECT any violation.

### Rule 2: Remove Logback - Use Log4j2 Only
```xml
❌ WRONG in pom.xml:
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-logging</artifactId>
</dependency>

✅ CORRECT in pom.xml:
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
```

**Check**: `mvn dependency:tree | grep logback` must return NOTHING.

### Rule 3: MapStruct ONLY - NO ModelMapper
```java
❌ NOT ALLOWED:
@Autowired
private ModelMapper modelMapper;

✅ REQUIRED:
@Mapper(componentModel = "spring")
public interface UserMapper {
    UserDto toDto(User user);
}

@Autowired
private UserMapper userMapper;
```

**Reason**: Performance, compile-time safety.

### Rule 4: No Hardcoded Secrets
```java
❌ WRONG:
private static final String API_KEY = "secret123";

✅ CORRECT:
@Value("${api-key}")
private String apiKey;
```

**All secrets must come from `.env` → environment variables → `@Value`**

### Rule 5: Token Must Not Expire
```java
❌ WRONG:
token.setExpiration(System.currentTimeMillis() + 3600000);  // 1 hour

✅ CORRECT:
token.setExpiration(null);  // Never expire
// Invalidation only via active=false in DB
```

### Rule 6: Single Active Token Per User (Mandatory)
```java
❌ WRONG:
// Allow multiple tokens for same user
authTokenRepository.save(newToken);

✅ CORRECT:
// Revoke old tokens before saving new one
List<AuthToken> oldTokens = authTokenRepository
    .findByUserIdAndIsActiveTrue(userId);
oldTokens.forEach(token -> {
    token.setIsActive(false);
    token.setRevokedAt(LocalDateTime.now());
});
authTokenRepository.saveAll(oldTokens);

// Then save new token
authTokenRepository.save(newToken);
```

### Rule 7: Permission Check at Runtime, NOT in Token
```java
❌ WRONG:
// Storing permission in JWT payload
claims.put("permissions", user.getPermissions());

✅ CORRECT:
// Token contains ONLY username + role
claims.put("username", user.getUsername());
claims.put("role", user.getRole());

// Check permission at request time
@Service
public class RequestService {
    public void approveRequest(Long id, String username) {
        // Load permission from DB at runtime
        User user = userRepository.findByUsername(username);
        Set<String> permissions = user.getRoles().stream()
            .flatMap(role -> role.getPermissions().stream())
            .map(Permission::getCode)
            .collect(Collectors.toSet());
        
        if (!permissions.contains("request.approve")) {
            throw new AccessDeniedException("Missing permission");
        }
    }
}
```

### Rule 8: x-api-key Check BEFORE JWT
```java
❌ WRONG:
http.authorizeHttpRequests()
    .anyRequest().authenticated()
    .and().addFilterBefore(jwtFilter(), ...);

✅ CORRECT:
http.addFilterBefore(apiKeyFilter(), UsernamePasswordAuthenticationFilter.class)
    .addFilterBefore(jwtFilter(), UsernamePasswordAuthenticationFilter.class);
```

**Order**: API Key Filter → JWT Filter → Security Filter

### Rule 9: Request/Response Encryption (AES-GCM)
```java
❌ WRONG:
public ResponseEntity<?> sensitiveData() {
    return ResponseEntity.ok(data);  // Plain text
}

✅ CORRECT:
@PostMapping("/request")
@Encrypted  // Custom annotation
public ResponseEntity<?> createRequest(@RequestBody EncryptedPayload payload) {
    String decrypted = encryptionService.decrypt(payload.getData(), payload.getIv());
    // Process...
    return ResponseEntity.ok(new EncryptedPayload(encrypted, iv));
}
```

### Rule 10: DB + Redis Sync for Token Storage
```java
❌ WRONG:
// Only store in Redis
redisTemplate.opsForValue().set("token:" + jti, token);

✅ CORRECT:
// 1. Save to DB (source of truth)
authTokenRepository.save(new AuthToken(
    userId, tokenJti, tokenHash, issuedAt, null  // expires_at = NULL
));

// 2. Save to Redis (cache)
redisTemplate.opsForValue().set("token:" + jti, token);

// 3. On read: Check Redis first (fast), fallback to DB (truth)
Optional<AuthToken> token = redisService.getToken(jti)
    .or(() -> dbService.getToken(jti));

// 4. On revoke: DB.update(is_active=false) + Redis.DEL(key)
```

### Rule 11: No Sensitive Data in Logs
```java
❌ WRONG:
logger.info("User logged in with password: " + password);
logger.debug("API Key: " + apiKey);

✅ CORRECT:
logger.info("User {} logged in successfully", username);
logger.debug("API request authorized");
```

### Rule 12: Password Hashing - bcrypt Min 12 Rounds
```java
❌ WRONG:
passwordEncoder = new BCryptPasswordEncoder();  // Default 10 rounds
passwordEncoder.encode(password);

✅ CORRECT:
passwordEncoder = new BCryptPasswordEncoder(12);  // Min 12 rounds
passwordEncoder.encode(password);
```

### Rule 13: All POST/PUT/PATCH Endpoints Must Have Idempotency Key
```java
❌ WRONG:
@PostMapping("/requests")
public ResponseEntity<?> create(@RequestBody RequestDto dto) { }

✅ CORRECT:
@PostMapping("/requests")
public ResponseEntity<?> create(
    @RequestHeader("Idempotency-Key") String idempotencyKey,
    @RequestBody RequestDto dto) {
    // Check & store idempotency key
    return idempotencyService.executeIdempotent(idempotencyKey, () -> {
        // Create request
    });
}
```

---

## 📋 CODE ORGANIZATION RULES

### Rule 14: Package Structure
```
com.adminportal.servicename/
├── application/
│   ├── controllers/         ← REST Endpoints
│   ├── dtos/               ← Request/Response models
│   ├── mappers/            ← MapStruct mappers
│   ├── services/           ← Business logic (not domain-specific)
│   └── events/             ← Application events
├── domain/
│   ├── entities/           ← JPA entities
│   ├── repositories/       ← Interface only (NO implementation)
│   ├── exceptions/         ← Domain exceptions
│   ├── specifications/     ← JPA Specifications for queries
│   ├── enums/              ← Domain enumerations
│   └── valueobjects/       ← Value objects
└── infrastructure/
    ├── config/             ← Spring configs
    ├── persistence/        ← Repository implementations
    ├── external/           ← External integrations (Keycloak, Kafka, Redis, Mail)
    ├── security/           ← Security filters, interceptors
    ├── encryption/         ← Encryption/decryption utils
    └── cache/              ← Cache implementations
```

**Rule**: NO cross-package imports between same-level packages (sibling packages). Only from outer → inner.

### Rule 15: Entity Naming Convention
```
❌ WRONG:
@Entity
@Table(name = "user")
public class UserEntity { }

✅ CORRECT:
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
}
```

**Convention**: Entity name = singular noun, Table name = plural

### Rule 16: DTO Naming Convention
```
CreateUserDto      ← For POST (create)
UpdateUserDto      ← For PUT/PATCH (update)
UserDto            ← For GET (response)
UserSearchDto      ← For search requests
UserListDto        ← For list items
```

### Rule 17: Controller Naming & Path
```
✅ CORRECT:
@RestController
@RequestMapping("/api/v1/users")
public class UserController {
    @GetMapping
    public ResponseEntity<?> list() { }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) { }
    
    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateUserDto dto) { }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody UpdateUserDto dto) { }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) { }
}
```

**Rules**:
- Version in path: `/api/v1/`
- Resource plural: `/users`
- No verb in path: `/users` not `/getUsers`
- Standard HTTP methods: GET, POST, PUT, DELETE, PATCH

### Rule 18: Service Method Naming
```
✅ CORRECT:
public class UserService {
    public UserDto create(CreateUserDto dto) { }
    public UserDto update(Long id, UpdateUserDto dto) { }
    public UserDto getById(Long id) { }
    public List<UserDto> listAll() { }
    public void delete(Long id) { }
    public boolean exists(Long id) { }
    public void validateEmail(String email) { }
}
```

### Rule 19: Exception Naming
```
❌ WRONG:
public class UserError extends Exception { }
public class InvalidUser extends Exception { }

✅ CORRECT:
public class UserNotFoundException extends BusinessException { }
public class InvalidEmailException extends BusinessException { }
public class UserAlreadyExistsException extends BusinessException { }
```

**Naming**: `[Noun][Situation]Exception` where Situation is: NotFound, Invalid, AlreadyExists, Unauthorized, Forbidden, etc.

---

## 🧪 TESTING RULES

### Rule 20: Minimum Test Coverage
```
target: ≥ 80% overall code coverage
- Domain logic: 90%+
- Services: 85%+
- Controllers: 70% (integration tests)
```

### Rule 21: Test Naming Convention
```
✅ CORRECT:
public class UserServiceTest {
    @Test
    void shouldCreateUserSuccessfully() { }
    
    @Test
    void shouldThrowExceptionWhenUsernameAlreadyExists() { }
    
    @Test
    void shouldValidateEmailFormatCorrectly() { }
}

Method name: should[Expectation][Condition]
```

### Rule 22: Integration Tests Use TestContainers
```java
❌ DON'T:
// Use in-memory H2 database
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:test"
})

✅ DO:
// Use TestContainers for PostgreSQL
@Testcontainers
@SpringBootTest
public class UserRepositoryIntegrationTest {
    @Container
    static PostgreSQLContainer<?> postgres = 
        new PostgreSQLContainer<>("postgres:16-alpine");
}
```

---

## 🔒 SECURITY RULES

### Rule 23: Input Validation
```java
✅ CORRECT:
@PostMapping
public ResponseEntity<?> create(
    @Valid @RequestBody CreateUserDto dto) {  // @Valid at controller
    // dto is already validated
    userService.create(dto);  // Service validates business logic
}

@Data
public class CreateUserDto {
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50)
    @Pattern(regexp = "^[a-zA-Z0-9_]+$")
    private String username;
    
    @NotBlank
    @Email
    private String email;
    
    @NotBlank
    @Size(min = 12, message = "Min 12 chars")
    private String password;
}
```

**Validation layers**:
1. **Controller**: Input format validation (@Valid)
2. **Service**: Business logic validation

### Rule 24: SQL Injection Prevention
```java
❌ WRONG:
String sql = "SELECT * FROM users WHERE username = '" + username + "'";
em.createNativeQuery(sql);

✅ CORRECT:
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
}

// Or with @Query
@Query("SELECT u FROM User u WHERE u.username = :username")
Optional<User> findByUsername(@Param("username") String username);
```

### Rule 25: CORS Configuration
```java
❌ WRONG:
@Bean
public WebMvcConfigurer corsConfigurer() {
    return new WebMvcConfigurer() {
        @Override
        public void addCorsMappings(CorsRegistry registry) {
            registry.addMapping("/**").allowedOrigins("*");  // Allow all
        }
    };
}

✅ CORRECT:
@Bean
public WebMvcConfigurer corsConfigurer() {
    return new WebMvcConfigurer() {
        @Override
        public void addCorsMappings(CorsRegistry registry) {
            registry.addMapping("/api/**")
                .allowedOrigins("https://yourdomain.com", "https://app.yourdomain.com")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
        }
    };
}
```

---

## 📊 DATABASE RULES

### Rule 26: Entity Annotations Required
```java
✅ CORRECT:
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_username", columnList = "username", unique = true),
    @Index(name = "idx_email", columnList = "email", unique = true),
    @Index(name = "idx_active", columnList = "is_active")
})
@EntityListeners(AuditingEntityListener.class)
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true, length = 50)
    private String username;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
```

**Required annotations**: @Entity, @Table, @Id, @GeneratedValue, @Column, @CreationTimestamp, @UpdateTimestamp

### Rule 27: Foreign Key Constraints
```java
✅ CORRECT:
@Entity
@Table(name = "auth_tokens")
public class AuthToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false, 
                foreignKey = @ForeignKey(name = "fk_tokens_user"))
    private User user;
}
```

**Rules**: Use @ForeignKey with explicit constraint names for clarity.

### Rule 28: Pagination Implementation
```java
❌ WRONG:
public List<User> getAll(int page, int size) {
    return userRepository.findAll().stream()
        .skip((page - 1) * size)
        .limit(size)
        .collect(Collectors.toList());
}

✅ CORRECT:
public Page<UserDto> getAll(Pageable pageable) {
    return userRepository.findAll(pageable)
        .map(userMapper::toDto);
}

// In controller
@GetMapping
public ResponseEntity<?> list(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size,
    @RequestParam(defaultValue = "createdAt") String sort) {
    
    Pageable pageable = PageRequest.of(page, size, Sort.by(sort).descending());
    Page<UserDto> result = userService.getAll(pageable);
    return ResponseEntity.ok(result);
}
```

---

## 🔄 VERSION CONTROL RULES

### Rule 29: Commit Message Format
```
✅ CORRECT:
feat: implement user registration endpoint
fix: resolve token expiration issue
refactor: simplify authentication filter
docs: update security guidelines
test: add integration tests for user service

❌ WRONG:
fixed bugs
updated code
changes
work in progress
```

**Format**: `<type>: <subject>`  
Types: feat, fix, docs, style, refactor, test, chore

### Rule 30: Branch Naming
```
✅ CORRECT:
feature/user-registration
bugfix/token-expiration
docs/security-guidelines
refactor/authentication-service

❌ WRONG:
dev
fix
user
auth
```

---

## 🐳 DOCKER RULES

### Rule 31: Dockerfile Java Optimization
```dockerfile
✅ CORRECT:
FROM openjdk:21-slim

RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY target/*.jar app.jar

ENV JAVA_OPTS="\
    -javaagent:/app/otel-javaagent.jar \
    -Dotel.service.name=auth-service \
    -XX:+UseG1GC \
    -XX:MaxGCPauseMillis=200 \
    -XX:InitiatingHeapOccupancyPercent=35 \
    -XX:+ParallelRefProcEnabled"

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8081/actuator/health/liveness || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
```

**Rules**: Use slim images, add health checks, enable garbage collection tuning, attach OpenTelemetry agent.

### Rule 32: Resource Limits (Required)
```yaml
deploy:
  resources:
    limits:
      cpus: "X.X"
      memory: XYZMb
    reservations:
      cpus: "X.X"
      memory: XYZMb
```

**⚠️ EVERY service in docker-compose MUST have resource limits**

---

## 📝 DOCUMENTATION RULES

### Rule 33: Code Comments
```java
❌ WRONG:
// Increment counter
counter++;

// Loop through users
for (User user : users) { }

✅ CORRECT:
// Track number of approved requests for quota enforcement
counter++;

// Validate each user has required permissions before processing
for (User user : users) { }

// Complex business logic MUST be explained
// Single session per user: revoke old tokens before issuing new one
// to prevent concurrent access from multiple devices
List<AuthToken> oldTokens = authTokenRepository
    .findByUserIdAndIsActiveTrue(userId);
oldTokens.forEach(token -> token.setIsActive(false));
```

### Rule 34: JavaDoc for Public APIs
```java
/**
 * Creates a new purchasing request in the system.
 *
 * @param dto the request creation data (must be valid)
 * @param username the user creating the request
 * @return the created request DTO
 * @throws UserNotFoundException if user not found
 * @throws InvalidRequestException if request data is invalid
 */
@PostMapping
public ResponseEntity<?> createRequest(
    @Valid @RequestBody CreateRequestDto dto,
    @AuthenticationPrincipal String username) {
    // Implementation
}
```

**Rules**: Document all public methods with purpose, parameters, returns, and exceptions.

---

## ✅ PRE-COMMIT CHECKLIST

Before committing code, verify:

- [ ] No Logback dependencies in pom.xml
- [ ] No ModelMapper usage
- [ ] No hardcoded secrets
- [ ] Token expiration is null
- [ ] x-api-key validation exists
- [ ] Single session check implemented
- [ ] Permission check at runtime (not in token)
- [ ] All POST/PUT/PATCH endpoints have idempotency key
- [ ] Clean Architecture followed (no circular dependencies)
- [ ] Request/Response encryption for sensitive data
- [ ] All DTOs have @Valid or @Validated
- [ ] Exception handling with custom exceptions
- [ ] Test coverage ≥ 80%
- [ ] No SQL injection vulnerabilities
- [ ] Log4j2 configuration exists
- [ ] OpenTelemetry integration present
- [ ] All containers have resource limits
- [ ] All entities have required annotations
- [ ] Commit message follows format

---

## 🚨 CODE REVIEW FAILURE CRITERIA

Code review will **REJECT** if:

1. ❌ Logback still present
2. ❌ ModelMapper used
3. ❌ Hardcoded secrets
4. ❌ Token has expiration time
5. ❌ Multiple active tokens per user
6. ❌ Permission stored in JWT
7. ❌ Missing x-api-key validation
8. ❌ Missing idempotency key on POST/PUT/PATCH
9. ❌ Clean Architecture violated
10. ❌ No test coverage
11. ❌ SQL injection risk
12. ❌ Unencrypted sensitive response
13. ❌ Missing error handling
14. ❌ No resource limits in Docker

---

**Last Updated**: 24/04/2026  
**Enforced By**: Code Review & CI/CD Pipeline
