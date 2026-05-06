# FRONTEND CLEAN CODE & SOLID GUIDELINES

**Purchasing Request Portal - Frontend Development Standards**

> Tài liệu này quy định các tiêu chuẩn viết code để đảm bảo ứng dụng dễ bảo trì, dễ mở rộng và có hiệu năng tốt nhất.

---

## 1. Nguyên lý SOLID trong Angular

### 1.1. Single Responsibility Principle (SRP) - Đơn nhiệm
- **Component:** Chỉ lo việc hiển thị và phản hồi sự kiện người dùng. Không viết logic tính toán phức tạp hoặc gọi API trực tiếp.
- **Service:** Mỗi service chỉ làm một việc (ví dụ: `AuthService` lo về token, `UserApiService` lo về gọi API người dùng).
- **Quy tắc:** Nếu một file `.ts` dài quá 300 dòng, hãy cân nhắc tách nó ra.

### 1.2. Open/Closed Principle (OCP) - Đóng và Mở
- Các Component nên được thiết kế để có thể mở rộng qua `@Input` và `ng-content` thay vì sửa code bên trong mỗi khi cần thêm tính năng mới.

### 1.3. Dependency Inversion Principle (DIP) - Nghịch đảo phụ thuộc
- Luôn inject phụ thuộc qua `constructor`.
- Sử dụng các `InjectionToken` cho các cấu hình (như API URL, Encryption Secret) để dễ dàng thay đổi mà không cần sửa code service.

---

## 2. Chiến lược Smart & Dumb Components

Đây là chìa khóa để giữ cho UI sạch sẽ:

### Dumb Components (Thành phần trình diễn)
- **Nhiệm vụ:** Chỉ hiển thị giao diện.
- **Giao tiếp:** Nhận dữ liệu qua `@Input` và gửi sự kiện qua `@Output`.
- **Ví dụ:** `app-status-badge`, `app-button`, `app-user-card`.
- **Vị trí:** `shared/components`.

### Smart Components (Thành phần logic)
- **Nhiệm vụ:** Kết nối với Services, quản lý trạng thái, xử lý logic nghiệp vụ.
- **Vị trí:** `features/` (ví dụ: `UserListComponent`).
- **Giao tiếp:** Chứa các Dumb Components và truyền dữ liệu cho chúng.

---

## 3. RxJS & Signals Best Practices (Angular 18)

- **Ưu tiên Signals:** Sử dụng `signal`, `computed` cho các dữ liệu hiển thị trên template để tối ưu Change Detection.
- **Tránh Nested Subscribe:** Tuyệt đối không subscribe bên trong một subscribe khác. Sử dụng các toán tử như `switchMap`, `mergeMap`.
- **Unsubscribe:** Luôn sử dụng `takeUntilDestroyed()` (Angular 16+) hoặc pipe `async` trên template để tránh rò rỉ bộ nhớ (memory leak).
- **Template Logic:** Giữ template sạch nhất có thể. Không viết các phép toán phức tạp trong HTML. 
  - ❌ **Sai:** `*ngIf="user.status === 1 && user.roles.length > 0"`
  - ✅ **Đúng:** `*ngIf="canShowUserDetails()"` (Với `canShowUserDetails` là một `computed signal`).

---

## 4. Quy tắc đặt tên (Naming Conventions)

- **Files:** `kebab-case.component.ts`, `kebab-case.service.ts`.
- **Classes:** `PascalCaseComponent`.
- **Variables/Methods:** `camelCase`.
- **Private Variables:** Bắt đầu bằng dấu gạch dưới (ví dụ: `private _state = signal(...)`).
- **Observables:** Kết thúc bằng dấu `$` (ví dụ: `user$ = this.userService.getUser()`).

---

## 5. Tổ chức thư mục chuẩn

```text
src/app/
├── core/              ← (Singleton) Interceptors, Guards, Global Services (Auth)
├── shared/            ← Dumb Components, Directives, Pipes dùng chung toàn dự án
├── features/          ← Smart Components theo từng module chức năng
│   ├── users/
│   ├── requests/
│   └── dashboard/
├── core/models/       ← Interfaces, Enums cho toàn bộ hệ thống
└── theme/             ← Global CSS, Tailwind configurations
