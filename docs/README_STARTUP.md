# Hướng Dẫn Khởi Động Dự Án (Admin Portal)

Dự án này sử dụng kiến trúc Microservices và được đóng gói cùng Docker. Cấu hình Spring Boot cho tất cả các service đã được tách thành các profile riêng biệt (`local`, `docker`, `prod`) để dễ dàng quản lý môi trường.

---

## 1. Cấu hình Môi Trường (`.env`)

Trước khi khởi động, hãy đảm bảo bạn đã tạo file `.env` tại thư mục gốc của dự án (`admin-portal/.env`).
Bạn có thể copy nội dung từ file `.env.example` hoặc sử dụng file `.env` hiện tại.

**Các thông số quan trọng cần lưu ý:**
- `SPRING_PROFILES_ACTIVE`: Chọn `docker` nếu bạn chạy toàn bộ trên Docker, hoặc `local` nếu bạn chạy qua IDE (IntelliJ / VS Code).
- `API_KEY`: Phải cung cấp khi gọi API qua header `x-api-key`.
- `ENCRYPT_SECRET`: Phải đúng 32 ký tự (dùng cho AES-256).

---

## 2. Cách Khởi Động Bằng Docker (Khuyên Dùng)

Đây là cách nhanh nhất để khởi động toàn bộ dự án gồm cả Infrastructure (Hạ tầng) và các Services.

**Bước 1: Khởi động Hạ tầng (Infrastructure)**
Hạ tầng bao gồm PostgreSQL, Redis, Kafka, và Keycloak.

```bash
docker-compose up -d postgres redis kafka keycloak
```
*Lưu ý: Bạn nên đợi khoảng 1-2 phút để Keycloak khởi động hoàn toàn và import file cấu hình (Realm).*

**Bước 2: Khởi động Các Service**
```bash
docker-compose up -d auth-service domain-service gateway-service
```

**Kiểm tra trạng thái:**
```bash
docker ps
# Hoặc xem log của auth-service
docker logs -f portal-auth-service
```

---

## 3. Cách Khởi Động Qua IDE (Local Development)

Nếu bạn muốn debug trực tiếp các Java Service trên IntelliJ, Eclipse hoặc VS Code, hãy làm theo các bước sau.

**Bước 1: Khởi động riêng Hạ tầng qua Docker**
```bash
docker-compose up -d postgres redis kafka keycloak
```

**Bước 2: Cài đặt Biến Môi Trường cho IDE**
Đảm bảo IDE của bạn chạy với biến môi trường `SPRING_PROFILES_ACTIVE=local`. Ở chế độ `local`, các services sẽ tự động trỏ vào `localhost:5432` cho DB, `localhost:6379` cho Redis,...

**Bước 3: Chạy lần lượt các service**
Mở 3 terminal khác nhau tại thư mục gốc `admin-portal` và chạy lệnh sau (hoặc cấu hình Run/Debug trong IDE):

1. **Auth Service:**
```bash
cd services/auth-service
mvn spring-boot:run -Dspring-boot.run.profiles=local
```
*(Chạy ở port 8081)*

2. **Domain Service:**
```bash
cd services/domain-service
mvn spring-boot:run -Dspring-boot.run.profiles=local
```
*(Chạy ở port 8082)*

3. **API Gateway:**
```bash
cd services/gateway-service
mvn spring-boot:run -Dspring-boot.run.profiles=local
```
*(Chạy ở port 8000)*

---

## 4. Các Endpoints Cấu Hình & Monitoring
- **API Gateway:** `http://localhost:8000` (Sử dụng URL này cho mọi thao tác gọi API trên Postman).
- **Keycloak Admin Console:** `http://localhost:8080/admin` (User/Pass lấy từ file `.env` - mặc định là `admin/admin`).
- **Postgres:** `localhost:5432` (Connect bằng DBeaver/DataGrip).
- **Redis:** `localhost:6379`.
