# BACKEND CLEAN ARCHITECTURE & SOLID GUIDELINES

**Purchasing Request Portal - Backend Refactoring Standards**

> Tài liệu này đóng vai trò là "kim chỉ nam" cho quá trình refactor (tái cấu trúc) mã nguồn Backend. Mục tiêu là biến một codebase đang "rối" thành một hệ thống tuân thủ chặt chẽ Clean Architecture và các nguyên lý SOLID, đảm bảo dễ đọc, dễ bảo trì, và dễ mở rộng.

---

## 1. Triết lý Thiết kế (Design Philosophy)

Mã nguồn hiện tại đang có hiện tượng trộn lẫn giữa Logic nghiệp vụ (Business Logic) và Logic giao tiếp (Framework/Infrastructure). Chúng ta sẽ refactor để đạt được các mục tiêu sau:
1. **Độc lập với Framework:** Core logic không được phụ thuộc vào Spring Boot (trừ các annotation cơ bản như `@Service`, `@Component`).
2. **Độc lập với Database:** Logic nghiệp vụ không quan tâm dữ liệu được lưu bằng PostgreSQL hay MongoDB.
3. **Độc lập với UI:** Việc giao tiếp qua REST API, gRPC hay GraphQL không ảnh hưởng đến Logic bên trong.

---

## 2. Tổ chức Package chuẩn (Package Structure)

Mọi Microservice phải tuân thủ nghiêm ngặt cấu trúc thư mục sau:

```text
com.adminportal.[service_name]
├── domain/                  # BẤT KHẢ XÂM PHẠM (Không phụ thuộc bất kỳ library ngoài nào)
│   ├── entity/              # Domain Models (Không phải JPA Entities)
│   ├── exception/           # Business Exceptions (BaseBusinessException, ResourceNotFound...)
│   └── valueobject/         # Value Objects (Email, PhoneNumber, Money...)
│
├── application/             # NƠI ĐIỀU PHỐI NGHIỆP VỤ (USE CASES)
│   ├── port/
│   │   ├── in/              # Input Ports (Interfaces cho Controller gọi vào - UseCases)
│   │   └── out/             # Output Ports (Interfaces cho DB, External Services)
│   ├── service/             # Nơi chứa các Interface của Service nội bộ
│   │   └── impl/            # Nơi chứa Implementation (UserServiceImpl implements UserService)
│   └── dto/                 # Request/Response Data Transfer Objects
│
└── infrastructure/          # CHI TIẾT KỸ THUẬT (DB, REST, CONFIG)
    ├── web/                 # Controllers, Filters, GlobalExceptionHandler
    ├── persistence/         # JPA Entities, Spring Data Repositories, Adapters
    ├── external/            # Gọi API ngoài (FeignClient, Keycloak, Redis)
    └── config/              # Cấu hình Spring (Security, Kafka, Beans)
```

---

## 3. Áp dụng Nguyên lý SOLID vào Thực tế

### 3.1. S - Single Responsibility Principle (Đơn nhiệm)
- **Vấn đề hiện tại:** Một class `UserService` đang vừa xử lý logic tạo User, vừa mã hóa mật khẩu, vừa gửi email, vừa gọi Repository.
- **Giải pháp Refactor:** 
  - Tách thành các class nhỏ: `UserRegistrationUseCase`, `PasswordHashingService`, `EmailNotificationPort`.
  - Một Controller chỉ nên xử lý HTTP Request/Response, không chứa logic kiểm tra điều kiện (if/else) nghiệp vụ.

### 3.2. O - Open/Closed Principle (Đóng/Mở)
- **Vấn đề hiện tại:** Khi thêm một phương thức thanh toán mới, phải sửa code của class `PaymentService`.
- **Giải pháp Refactor:** 
  - Sử dụng Interface (ví dụ: `PaymentStrategy`). Khi cần thêm phương thức thanh toán, chỉ cần tạo class mới implements interface này mà không chạm vào code cũ.

### 3.3. L - Liskov Substitution Principle (Thay thế Liskov)
- Đảm bảo các class con (Implementations) phải thực hiện đúng hợp đồng (Contract) mà Interface (Ports) đã định nghĩa.
- Không ném ra các Exception bất ngờ mà Interface không khai báo.

### 3.4. I - Interface Segregation Principle (Chia nhỏ Interface)
- **Vấn đề hiện tại:** Một interface `UserRepositoryPort` chứa tới 30 methods (CRUD, tìm kiếm, báo cáo).
- **Giải pháp Refactor:** Chia nhỏ thành:
  - `UserCommandPort` (Save, Update, Delete)
  - `UserQueryPort` (FindById, FindAll)
  - Controller nào cần đọc dữ liệu thì chỉ inject `UserQueryPort`.

### 3.5. D - Dependency Inversion Principle (Nghịch đảo phụ thuộc)
- **Vấn đề hiện tại:** Controller phụ thuộc trực tiếp vào `UserService` (Implementation).
- **Giải pháp Refactor:** Controller chỉ biết đến Interface (`UseCase` hoặc `Service Port`). 

---

## 4. Quy tắc: Giao diện và Triển khai (Interface & Implementation)

Để code chuẩn mực và dễ mock khi viết Unit Test, chúng ta áp dụng quy tắc tách biệt Interface và Implementation:

### 4.1. Cách đặt tên
- **Interface:** Đặt tên thể hiện hành vi (Ví dụ: `UserService`, `RoleManagementUseCase`, `TokenCachePort`).
- **Implementation:** Thêm hậu tố `Impl` hoặc `Adapter` tùy vị trí:
  - Ở tầng Application: `UserServiceImpl implements UserService`.
  - Ở tầng Infrastructure: `PostgresUserRepositoryAdapter implements UserRepositoryPort`.

### 4.2. Ví dụ chuẩn mực cho Service
**❌ Cách viết CŨ (Không khuyên dùng):**
```java
// Vừa khai báo vừa viết logic trong cùng 1 class
@Service
public class UserManagementService {
    public UserDto createUser(UserDto dto) { ... }
}
```

**✅ Cách viết MỚI (Chuẩn Clean Code):**
```java
// 1. Tạo Interface (Nằm ở com.adminportal.auth.application.service)
public interface UserManagementService {
    UserDto createUser(UserDto dto);
}

// 2. Tạo Implementation (Nằm ở com.adminportal.auth.application.service.impl)
@Service
@RequiredArgsConstructor
@Slf4j
public class UserManagementServiceImpl implements UserManagementService {
    private final UserRepositoryPort userRepositoryPort; // Inject Port, không inject JPA Repo

    @Override
    public UserDto createUser(UserDto dto) {
        log.info("Creating user: {}", dto.getUsername());
        // Business logic here
        return new UserDto(...);
    }
}
```

---

## 5. Quy tắc Luồng dữ liệu (Data Flow)

Luồng dữ liệu (Dependency Rule) chỉ được phép đi TỪ NGOÀI VÀO TRONG:

1. **Web (Controller)** nhận `RequestDto`.
2. Controller map `RequestDto` thành `Command`/`Query` object và đẩy vào **Input Port (UseCase)**.
3. **Application Service (UseCase Impl)** nhận lệnh, thực hiện logic. Nó gọi các **Output Port (Repository Port)**.
4. **Infrastructure Adapter** nhận lệnh từ Output Port, map sang `JPA Entity`, lưu vào DB, sau đó trả về `Domain Entity` cho Application Service.
5. Application Service map `Domain Entity` thành `ResponseDto` và trả về cho Controller.

**⛔ LỆNH CẤM:**
- Tuyệt đối KHÔNG trả về `JPA Entity` (như `@Entity class User`) ra ngoài Controller. Phải map sang `Dto`.
- Tuyệt đối KHÔNG inject `JpaRepository` vào thẳng `Application Service`. Phải inject `RepositoryPort`.

---

## 6. Lộ trình Refactor đề xuất

Khi bạn bắt đầu refactor một service (ví dụ: `auth-service`), hãy làm theo các bước sau:
1. **Bước 1:** Đổi tên và gom nhóm các thư mục cho chuẩn cấu trúc Clean Architecture.
2. **Bước 2:** Xóa các dependency trực tiếp giữa Service và JPA Repository. Tạo `Port` (Interface) và `Adapter` (Implementation) để kết nối.
3. **Bước 3:** Tách các class Service "toàn năng" thành cặp `Interface` và `Impl`.
4. **Bước 4:** Tạo các class DTO (Request/Response) riêng biệt nếu đang dùng chung Entity.
5. **Bước 5:** Thêm đầy đủ Logging (SLF4J) và xử lý lỗi thông qua GlobalExceptionHandler.
