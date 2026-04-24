# QUICK REFERENCE GUIDE

**Purchasing Request Portal - Developer Quick Reference**

---

## 🔍 Quick Lookups

### 1️⃣ Service Ports & URLs
```
Frontend (Angular):      http://localhost:80
API Gateway:             http://localhost:8000/api/v1
Auth Service:            http://localhost:8081
Domain Service:          http://localhost:8082
Keycloak:                http://localhost:8080
PostgreSQL:              localhost:5432
Redis:                   localhost:6379
Kafka:                   localhost:9092
```

### 2️⃣ Essential Dependencies (pom.xml)

**Spring Boot & Web**:
```xml
<!-- Spring Boot 3.3 -->
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.3.1</version>
</parent>

<!-- Exclude Logback, add Log4j2 -->
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

**Security & Auth**:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.12.5</version>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.12.5</version>
    <scope>runtime</scope>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.12.5</version>
    <scope>runtime</scope>
</dependency>
```

**Mapper & Validation**:
```xml
<dependency>
    <groupId>org.mapstruct</groupId>
    <artifactId>mapstruct</artifactId>
    <version>1.5.5.Final</version>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
```

**Database & Cache**:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
    <scope>runtime</scope>
</dependency>
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-database-postgresql</artifactId>
</dependency>
```

**Messaging**:
```xml
<dependency>
    <groupId>org.springframework.kafka</groupId>
    <artifactId>spring-kafka</artifactId>
</dependency>
```

**Others**:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-mail</artifactId>
</dependency>
<dependency>
    <groupId>dev.samstevens.totp</groupId>
    <artifactId>totp</artifactId>
    <version>1.7.1</version>
</dependency>
```

### 3️⃣ Common Annotations Reference

```java
// REST Controllers
@RestController
@RequestMapping("/api/v1/users")
@GetMapping
@PostMapping
@PutMapping
@DeleteMapping
@PathVariable
@RequestParam
@RequestBody
@ResponseStatus(HttpStatus.CREATED)

// Security & Auth
@RequirePermission("permission.code")
@Encrypted  // Custom annotation
@AuthenticationPrincipal
@PreAuthorize("hasRole('ADMIN')")

// Validation
@Valid
@NotBlank
@Email
@Size(min = X, max = Y)
@Pattern(regexp = "^[a-zA-Z0-9_]+$")
@NotEmpty
@NotNull

// ORM
@Entity
@Table(name = "table_name")
@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
@Column(nullable = false, unique = true)
@ManyToOne
@OneToMany
@ManyToMany
@JoinTable
@ForeignKey
@Transient
@EntityListeners(AuditingEntityListener.class)
@CreationTimestamp
@UpdateTimestamp

// Mapper
@Mapper(componentModel = "spring")
@Mapping(target = "field", source = "sourceField")
@Mapping(target = "id", ignore = true)
@MappingTarget

// Service
@Service
@Transactional
@Transactional(readOnly = true)

// Repository
@Repository

// Configuration
@Configuration
@Bean
@Value("${property.name}")
@ConfigurationProperties("prefix")
@EnableRedisRepositories
@EnableScheduling

// Testing
@SpringBootTest
@DataJpaTest
@WebMvcTest(ControllerClass.class)
@Testcontainers
@Container
@Test
@Disabled
@ParameterizedTest
```

### 4️⃣ Entity Boilerplate Template

```java
@Entity
@Table(name = "table_name", indexes = {
    @Index(name = "idx_unique_field", columnList = "unique_field", unique = true),
    @Index(name = "idx_status", columnList = "status")
})
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
public class EntityName {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true, length = 100)
    private String uniqueField;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Status status;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false, 
                foreignKey = @ForeignKey(name = "fk_table_user"))
    private User user;
    
    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Child> children;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @Version
    private Long version;  // For optimistic locking
}
```

### 5️⃣ Service Layer Boilerplate

```java
@Service
@Transactional
public class EntityService {
    
    @Autowired
    private EntityRepository entityRepository;
    
    @Autowired
    private EntityMapper entityMapper;
    
    @Autowired
    private Logger logger;
    
    // CREATE
    public EntityDto create(CreateEntityDto dto) {
        logger.info("Creating entity: {}", dto.getName());
        
        // Validation
        if (entityRepository.existsByUniqueField(dto.getUniqueField())) {
            throw new EntityAlreadyExistsException("Unique field already exists");
        }
        
        // Map & Save
        Entity entity = entityMapper.toEntity(dto);
        Entity saved = entityRepository.save(entity);
        
        logger.info("Entity created with ID: {}", saved.getId());
        return entityMapper.toDto(saved);
    }
    
    // READ
    @Transactional(readOnly = true)
    public EntityDto getById(Long id) {
        Entity entity = entityRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("ID: " + id));
        return entityMapper.toDto(entity);
    }
    
    // LIST with Pagination
    @Transactional(readOnly = true)
    public Page<EntityDto> list(Pageable pageable) {
        return entityRepository.findAll(pageable)
            .map(entityMapper::toDto);
    }
    
    // UPDATE
    public EntityDto update(Long id, UpdateEntityDto dto) {
        Entity entity = entityRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("ID: " + id));
        
        entityMapper.updateEntity(dto, entity);
        Entity updated = entityRepository.save(entity);
        
        return entityMapper.toDto(updated);
    }
    
    // DELETE
    public void delete(Long id) {
        if (!entityRepository.existsById(id)) {
            throw new EntityNotFoundException("ID: " + id);
        }
        entityRepository.deleteById(id);
    }
}
```

### 6️⃣ Controller Boilerplate

```java
@RestController
@RequestMapping("/api/v1/entities")
public class EntityController {
    
    @Autowired
    private EntityService entityService;
    
    @GetMapping
    public ResponseEntity<?> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sort) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(sort).descending());
        Page<EntityDto> result = entityService.list(pageable);
        
        return ResponseEntity.ok(new ApiResponse(true, result, LocalDateTime.now()));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        EntityDto entity = entityService.getById(id);
        return ResponseEntity.ok(new ApiResponse(true, entity, LocalDateTime.now()));
    }
    
    @PostMapping
    public ResponseEntity<?> create(
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody CreateEntityDto dto) {
        
        EntityDto created = entityService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(new ApiResponse(true, created, LocalDateTime.now()));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody UpdateEntityDto dto) {
        
        EntityDto updated = entityService.update(id, dto);
        return ResponseEntity.ok(new ApiResponse(true, updated, LocalDateTime.now()));
    }
    
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        entityService.delete(id);
    }
}
```

### 7️⃣ Global Exception Handler Boilerplate

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<?> handleEntityNotFound(EntityNotFoundException ex) {
        logger.warn("Entity not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse("ENTITY_NOT_FOUND", ex.getMessage(), null, LocalDateTime.now()));
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidationError(MethodArgumentNotValidException ex) {
        List<ErrorDetail> errors = ex.getBindingResult().getFieldErrors().stream()
            .map(error -> new ErrorDetail(error.getField(), error.getDefaultMessage()))
            .collect(Collectors.toList());
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(new ErrorResponse("VALIDATION_ERROR", "Input validation failed", errors, LocalDateTime.now()));
    }
    
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<?> handleAccessDenied(AccessDeniedException ex) {
        logger.warn("Access denied: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(new ErrorResponse("ACCESS_DENIED", "You do not have permission", null, LocalDateTime.now()));
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGenericException(Exception ex) {
        logger.error("Unexpected error", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(new ErrorResponse("INTERNAL_ERROR", "An unexpected error occurred", null, LocalDateTime.now()));
    }
}
```

### 8️⃣ Key Environment Variables

```bash
# Spring
SPRING_PROFILES_ACTIVE=docker
SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/adminportal
SPRING_DATASOURCE_USERNAME=portaluser
SPRING_DATASOURCE_PASSWORD=<password>

# Redis
SPRING_DATA_REDIS_HOST=redis
SPRING_DATA_REDIS_PORT=6379
SPRING_DATA_REDIS_PASSWORD=<password>

# Kafka
SPRING_KAFKA_BOOTSTRAP_SERVERS=kafka:9092

# Security
API_KEY=<min-32-chars>
TOKEN_SECRET=<min-32-chars>
ENCRYPT_SECRET=<exactly-32-chars>

# Keycloak
KEYCLOAK_URL=http://keycloak:8080
KEYCLOAK_REALM=adminportal
KEYCLOAK_CLIENT_ID=auth-service
KEYCLOAK_CLIENT_SECRET=<secret>

# Mail
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=noreply@example.com
MAIL_PASSWORD=<app-password>

# OpenTelemetry
OTEL_SERVICE_NAME=auth-service
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
```

### 9️⃣ Common SQL Queries

**Find user by username**:
```sql
SELECT * FROM users WHERE username = $1;
```

**Check active token**:
```sql
SELECT * FROM auth_tokens 
WHERE user_id = $1 AND is_active = true AND revoked_at IS NULL;
```

**Find user permissions**:
```sql
SELECT DISTINCT p.code FROM permissions p
JOIN role_permissions rp ON p.id = rp.permission_id
JOIN roles r ON rp.role_id = r.id
JOIN user_roles ur ON r.id = ur.role_id
WHERE ur.user_id = $1 AND r.is_active = true AND p.is_active = true;
```

**Pending approval requests**:
```sql
SELECT pr.* FROM purchasing_requests pr
WHERE pr.status = 'PENDING' 
ORDER BY pr.requested_date DESC;
```

### 🔟 Git Commands

```bash
# Setup
git clone <repo-url>
cd admin-portal
cp .env.template .env
# Edit .env with actual values

# Feature branch
git checkout -b feature/user-registration
# ... make changes
git add .
git commit -m "feat: implement user registration"
git push origin feature/user-registration

# Bug fix
git checkout -b bugfix/token-expiration
git commit -m "fix: resolve token never expiring"
git push origin bugfix/token-expiration

# Before pushing
git status          # Check changes
git diff            # Review changes
mvn test            # Run tests
mvn clean package   # Build

# Pull request
# Go to GitHub → Create PR
# Describe: what, why, how
# Link issues
```

---

## 📞 Quick Troubleshooting

### Issue: Logback logs appearing

**Solution**:
```bash
mvn dependency:tree | grep logback
mvn clean install
# Verify log4j2.xml is at src/main/resources/log4j2/log4j2.xml
```

### Issue: ModelMapper not working

**Solution**: Use MapStruct instead
```java
@Mapper(componentModel = "spring")
public interface UserMapper {
    UserDto toDto(User user);
}
```

### Issue: Token expires too soon

**Solution**: Check configuration
```java
// Token should have:
claims.put("exp", null);  // Or don't set expiration at all
```

### Issue: Multiple active tokens per user

**Solution**: Implement single session
```java
// Before saving new token:
authTokenRepository.findByUserIdAndIsActiveTrue(userId)
    .forEach(token -> token.setIsActive(false));
```

### Issue: Permission not checked at runtime

**Solution**: Load from DB in service layer
```java
User user = userRepository.findByUsername(username)
    .orElseThrow();
Set<String> permissions = user.getRoles().stream()
    .flatMap(role -> role.getPermissions().stream())
    .map(Permission::getCode)
    .collect(Collectors.toSet());
if (!permissions.contains("required.permission")) {
    throw new AccessDeniedException();
}
```

### Issue: Docker containers crashing

**Solution**: Check logs
```bash
docker-compose logs postgres
docker-compose logs auth-service
docker-compose logs -f gateway-service

# Check resource limits
docker stats
```

---

**Last Updated**: 24/04/2026
