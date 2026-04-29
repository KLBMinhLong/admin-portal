#!/bin/sh

# Đọc các biến môi trường và thiết lập giá trị mặc định nếu không có
API_KEY=${API_KEY:-"changeme"}
ENCRYPT_SECRET=${ENCRYPT_SECRET:-"encryptkey_changeme_32chars_1234"}

# Thay thế các placeholder trong tất cả các file .js được sinh ra bởi Angular
for file in /usr/share/nginx/html/*.js; do
  if [ -f "$file" ]; then
    sed -i "s|__API_KEY__|${API_KEY}|g" $file
    sed -i "s|__ENCRYPT_SECRET__|${ENCRYPT_SECRET}|g" $file
  fi
done

# Chạy lệnh tiếp theo được truyền vào từ CMD của Dockerfile (ví dụ: nginx -g daemon off;)
exec "$@"
