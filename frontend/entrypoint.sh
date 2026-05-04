#!/bin/sh

# Đọc các biến môi trường và thiết lập giá trị mặc định nếu không có
API_KEY=${API_KEY:-"changeme"}
ENCRYPT_SECRET=${ENCRYPT_SECRET:-"encryptkey_changeme_32chars_1234"}

# Thay thế các placeholder trong TẤT CẢ file .js (recursive) được sinh ra bởi Angular
find /usr/share/nginx/html -name "*.js" -type f | while read file; do
  sed -i "s|__API_KEY__|${API_KEY}|g" "$file"
  sed -i "s|__ENCRYPT_SECRET__|${ENCRYPT_SECRET}|g" "$file"
done

# Verify replacement (debug log)
echo "[entrypoint] API_KEY length: ${#API_KEY}"

# Chạy lệnh tiếp theo được truyền vào từ CMD của Dockerfile (ví dụ: nginx -g daemon off;)
exec "$@"
