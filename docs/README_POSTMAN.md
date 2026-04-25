# Hướng Dẫn Test API trên Postman (Admin Portal)

Tất cả các API sẽ được gọi thông qua **API Gateway** ở địa chỉ `http://localhost:8000`. Cổng này sẽ tự động định tuyến (route) request đến đúng service (`auth-service` hoặc `domain-service`).

## 1. Yêu Cầu Chung (Headers)
Mọi request gửi lên (kể cả Register hay Login) đều **bắt buộc** phải có Header bảo mật `x-api-key`.
Nếu thiếu, server sẽ trả về `401 Unauthorized` ngay lập tức.

- **Key**: `x-api-key`
- **Value**: Lấy từ giá trị `API_KEY` trong file `.env` (ví dụ: `my_test_api_key_min_32_characters_long`).

*(Mẹo Postman: Bạn có thể đưa biến này vào phần "Collection Variables" hoặc "Environment" để áp dụng cho mọi request tự động).*

---

## 2. Các API Xác Thực (Auth Service)

### 2.1. Đăng Ký Tài Khoản (Register)
- **Method:** `POST`
- **URL:** `http://localhost:8000/api/v1/auth/register`
- **Headers:**
  - `Content-Type`: `application/json`
  - `x-api-key`: `my_test_api_key_min_32_characters_long`
- **Body (raw JSON):**
```json
{
  "username": "john_doe_99",
  "email": "john.doe99@example.com",
  "password": "SecurePass@1234",
  "firstName": "John",
  "lastName": "Doe"
}
```

### 2.2. Đăng Nhập (Login)
- **Method:** `POST`
- **URL:** `http://localhost:8000/api/v1/auth/login`
- **Headers:**
  - `Content-Type`: `application/json`
  - `x-api-key`: `my_test_api_key_min_32_characters_long`
- **Body (raw JSON):**
```json
{
  "username": "john_doe_99",
  "password": "SecurePass@1234",
  "deviceInfo": "Postman-Client"
}
```
**Trường hợp 1 (Thành công):** API sẽ trả về HTTP 200 kèm `token`. Bạn cần copy `token` này để dùng cho các API yêu cầu đăng nhập.
**Trường hợp 2 (Cần 2FA):** API sẽ trả về HTTP 200 kèm `requiresTwoFactor = true` và một chuỗi `challenge`.

### 2.3. Xác thực 2FA (Nếu user bật 2FA)
Nếu API Login trả về `requiresTwoFactor: true`, bạn phải gọi thêm API này để lấy Token thật:
- **Method:** `POST`
- **URL:** `http://localhost:8000/api/v1/auth/verify-2fa`
- **Headers:**
  - `Content-Type`: `application/json`
  - `x-api-key`: `my_test_api_key_min_32_characters_long`
- **Body (raw JSON):**
```json
{
  "challenge": "chuỗi-challenge-nhận-được-từ-bước-login",
  "totpCode": "123456",
  "deviceInfo": "Postman-Client"
}
```

---

## 3. Mã Hóa Payload Bằng AES-256-GCM

Với các API có tính chất nhạy cảm, dữ liệu JSON của bạn cần được mã hoá AES trước khi gửi, và kết quả trả về cũng sẽ bị mã hoá.
Key mã hoá được định nghĩa trong file `.env` ở phần `ENCRYPT_SECRET` (Mặc định: `encryptkey_changeme_32chars_1234`).

Để test trên Postman, hệ thống mong đợi payload JSON có cấu trúc sau khi bật mã hóa:

```json
{
  "iv": "chuỗi-base64-của-vector-khởi-tạo",
  "ciphertext": "chuỗi-base64-của-dữ-liệu-đã-mã-hoá"
}
```

### Cách tạo Script Mã Hóa tự động trên Postman (Pre-request Script)

Bạn có thể viết một đoạn script Javascript ngắn ở tab **Pre-request Script** của Postman (Sử dụng thư viện `crypto-js`) để tự động chuyển `Body` dạng rõ của bạn thành `iv` và `ciphertext` trước khi gửi request.

**Ví dụ Script Pre-request (Basic AES-GCM):**
Do Postman mặc định hỗ trợ thư viện `crypto-js` (nhưng nó là AES-CBC), bạn có thể phải tự code luồng mã hóa hoặc tạo sẵn dữ liệu tĩnh bằng Java để test luồng này cho chính xác. 

**Khuyến nghị:** Trong quá trình test cục bộ hoặc phát triển, nếu chưa làm phần frontend, bạn có thể tạm tắt tính năng mã hóa này bằng cách set `app.encryption.enabled=false` trong `application-local.yml` của các service để test API trực tiếp dễ dàng hơn.
