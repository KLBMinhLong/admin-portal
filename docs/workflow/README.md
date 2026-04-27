# Hướng dẫn Quản lý và Tích hợp Camunda Workflow

Tài liệu này mô tả chi tiết về cách thức hoạt động, triển khai và quản lý các luồng quy trình (BPMN) trên hệ thống sử dụng Camunda Platform 7 được tích hợp trong Spring Boot `domain-service`.

## 1. Vị trí File BPMN và Khởi tạo tự động
Mọi file bản vẽ luồng có định dạng `.bpmn` (như `purchasing-request-approval.bpmn`) được lưu trữ tại:
`services/domain-service/src/main/resources/bpmn/`

**Auto-deployment:** 
Khi Spring Boot server khởi động, cấu hình `camunda.bpm.auto-deployment-enabled: true` sẽ quét tất cả các file trong thư mục này và tự động deploy vào DB của Camunda.

## 2. Các quy định khi vẽ luồng Camunda trong dự án
1. **History Time To Live (TTL):** Từ phiên bản Camunda 7.20+, **bắt buộc** tất cả các process phải được cấu hình thuộc tính TTL. Trong `bpmn:process`, cần khai báo `camunda:historyTimeToLive="P30D"` (Lưu history 30 ngày) để tránh lỗi ENGINE-09005 ParseException khi khởi động.
2. **Process ID:** Phải mang tính duy nhất, ví dụ `PurchasingRequestApproval`.
3. **Business Key:** Khi khởi tạo một Process Instance bằng Java code (`WorkflowService.java`), phải truyền `businessKey` là mã quy trình thực tế (VD: `PR-2026-001`) để sau này dễ dàng tracing trên hệ thống.
4. **BPMN Diagram Elements:** Không được sửa XML bằng tay xoá mất thẻ `<bpmndi:BPMNDiagram>`, vì nếu thiếu thẻ này, Camunda Modeler sẽ không thể render luồng dưới dạng hình ảnh, dẫn đến lỗi "no diagram to display".

## 3. Quản lý trạng thái bằng Camunda Webapp
Dự án đã tích hợp sẵn Camunda Webapp (thông qua `camunda-bpm-spring-boot-starter-webapp`).
- **URL truy cập:** `http://localhost:8082/camunda/app/`
- **Tài khoản mặc định:** `admin` / `admin` (Cấu hình tại biến môi trường `CAMUNDA_ADMIN_PASSWORD`).
- **Các module khả dụng:**
  - **Cockpit:** Theo dõi tiến trình các request đang chạy, kiểm tra biến (variables), và xem bản vẽ luồng trực tiếp.
  - **Tasklist:** Giao diện cho phép người dùng (nếu có tài khoản) xem các User Task đang chờ họ xử lý.
  - **Admin:** Quản lý người dùng, nhóm quyền (Groups) và phân quyền của Camunda.

## 4. Hướng dẫn Hot Deploy (Thay đổi luồng không cần restart Server)
Trong quá trình vận hành, đôi khi cần thêm hoặc bớt bước phê duyệt (ví dụ: thêm bước duyệt của CEO nếu tiền > 100M). Việc này có thể làm "nóng" (hot deploy) trên server đang chạy:

1. **Bước 1:** Tải và cài đặt **Camunda Modeler** phiên bản Desktop (tải tại: https://camunda.com/download/modeler/).
2. **Bước 2:** Mở file BPMN cần sửa đổi hoặc vẽ một luồng mới.
3. **Bước 3:** Nhấn vào nút biểu tượng chiếc tên lửa ở góc dưới bên trái (**Deploy current diagram**).
4. **Bước 4:** Ở ô **REST Endpoint**, điền địa chỉ API của server đang chạy:
   `http://localhost:8082/engine-rest`
   *(Lưu ý: API Key Filter của hệ thống đã được cấu hình loại trừ (bypass) cho endpoint này).*
5. **Bước 5:** Bấm **Deploy**. 

Hệ thống sẽ ghi nhận phiên bản mới (Version 2). Bất kỳ Yêu cầu mua sắm nào tạo MỚI sau thời điểm này sẽ tự động chạy vào luồng Version 2. Các yêu cầu cũ đang chạy dở sẽ tiếp tục áp dụng luồng cũ (Version 1).

## 5. Tương tác từ Domain Layer (Spring Boot) với Camunda
Toàn bộ logic tương tác với Camunda (Start process, Complete task, Truy vấn task) phải được encapsulate trong class `WorkflowService` tại package `com.adminportal.domain.infrastructure.camunda`. 
Tránh để Camunda's API (như `RuntimeService`, `TaskService`) rò rỉ ra tầng Use Case của ứng dụng nhằm đảm bảo nguyên tắc Clean Architecture.
