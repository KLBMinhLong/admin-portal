# SHARED COMPONENTS & WRAPPER STRATEGY

**Purchasing Request Portal - UI Architecture**

> Tài liệu này quy định cách xây dựng lớp thành phần dùng chung (Shared Components). Mục tiêu là tạo ra một lớp đệm (Abstraction Layer) giữa các thư viện bên ngoài và logic nghiệp vụ của ứng dụng.

---

## 1. Triết lý Thiết kế: "The Wrapper Pattern"

**Quy tắc vàng:** Các Component ở lớp chức năng (Features như `UserList`, `RequestForm`) KHÔNG ĐƯỢC sử dụng trực tiếp các thư viện UI bên ngoài hoặc các tag HTML thuần một cách rải rác. Chúng phải sử dụng các Component đã được đóng gói tại thư mục `shared/components`.

### Ví dụ về sự thay đổi:
- ❌ **Sai:** Sử dụng trực tiếp `<button class="btn-primary">` hoặc thư viện bên ngoài `<mat-button>`.
- ✅ **Đúng:** Sử dụng `<app-button type="primary">`. 

**Lợi ích:** Sau này nếu bạn muốn đổi toàn bộ nút bấm từ bo góc sang vuông, bạn chỉ cần sửa duy nhất file `shared/components/button.component.html`.

---

## 2. Phân loại Thành phần (Atomic Design Lite)

Chúng ta chia bộ Shared Components thành 3 nhóm chính:

### Nhóm 1: Atoms (Các phần tử nhỏ nhất)
- **Button:** Các loại nút (Primary, Secondary, Ghost, Danger).
- **Input:** Textbox, Password, Number (bao gồm cả trạng thái Error/Valid).
- **Badge/Status:** Hiển thị trạng thái (Success, Pending, Rejected).
- **Icon:** Wrapper cho bộ icon (Lucide, FontAwesome...).

### Nhóm 2: Molecules (Phức hợp đơn giản)
- **Form Group:** Kết hợp Label + Input + Validation Message.
- **Card:** Khung chứa nội dung với Header, Body, Footer chuẩn.
- **Search Bar:** Ô tìm kiếm có kèm nút Filter.

### Nhóm 3: Organisms (Các khối chức năng lớn)
- **Data Table:** Bảng dữ liệu có sẵn Pagination, Sorting.
- **Modal/Dialog:** Wrapper cho các cửa sổ pop-up.
- **Empty State:** Hiển thị khi không có dữ liệu.

---

## 3. Quy tắc phát triển (Development Rules)

### 3.1. Tính "Dumb" (Dumb Components)
- Shared Components **không được** chứa logic nghiệp vụ (không inject Services, không gọi API).
- Dữ liệu đi vào qua `@Input()` và sự kiện đi ra qua `@Output()`.

### 3.2. Tính Tùy biến (Configurability)
- Sử dụng các `type` hoặc `variant` để thay đổi kiểu dáng thay vì viết nhiều component tương tự.
- *Ví dụ:* `<app-button variant="outline" size="sm">`.

### 3.3. Đóng gói thư viện bên ngoài
Nếu dự án cần dùng một thư viện quá phức tạp (ví dụ: DatePicker), hãy tạo một component của mình bao quanh nó:
```typescript
// shared/components/date-picker
@Component({
  selector: 'app-date-picker',
  template: `<third-party-date-picker [config]="myConfig"></third-party-date-picker>`
})
