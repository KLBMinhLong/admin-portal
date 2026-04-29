const fs = require('fs');
const path = require('path');

function splitAngularComponent(filePath) {
    // 1. Đọc nội dung file
    if (!fs.existsSync(filePath)) {
        console.error(`❌ Không tìm thấy file: ${filePath}`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    const dir = path.dirname(filePath);
    const baseName = path.basename(filePath, '.ts'); // VD: request-list.component

    let isModified = false;

    // 2. Xử lý Template (HTML)
    // Tìm khối template: `...` 
    const templateRegex = /template:\s*`([\s\S]*?)`,?/m;
    const templateMatch = content.match(templateRegex);

    if (templateMatch) {
        const htmlContent = templateMatch[1].trim() + '\n';
        const htmlPath = path.join(dir, `${baseName}.html`);

        // Lưu file HTML
        fs.writeFileSync(htmlPath, htmlContent, 'utf8');
        console.log(`✅ Đã tạo: ${htmlPath}`);

        // Cập nhật file TS
        content = content.replace(templateRegex, `templateUrl: './${baseName}.html',`);
        isModified = true;
    }

    // 3. Xử lý Styles (SCSS/CSS)
    // Tìm khối styles: [`...`]
    const stylesRegex = /styles:\s*\[\s*`([\s\S]*?)`\s*\],?/m;
    const stylesMatch = content.match(stylesRegex);
    const stylePath = path.join(dir, `${baseName}.scss`); // Bạn có thể đổi thành .css nếu muốn

    if (stylesMatch) {
        const cssContent = stylesMatch[1].trim() + '\n';

        // Lưu file SCSS
        fs.writeFileSync(stylePath, cssContent, 'utf8');
        console.log(`✅ Đã tạo: ${stylePath}`);

        // Cập nhật file TS (Sử dụng styleUrl cho Angular 17+)
        content = content.replace(stylesRegex, `styleUrl: './${baseName}.scss',`);
        isModified = true;
    } else if (isModified && !content.includes('styleUrl') && !content.includes('styleUrls')) {
        // Nếu không có styles inline, tự động tạo file SCSS rỗng cho đúng chuẩn Angular CLI
        fs.writeFileSync(stylePath, '', 'utf8');
        console.log(`✅ Đã tạo file rỗng: ${stylePath}`);

        // Chèn thêm styleUrl ngay sau templateUrl
        content = content.replace(
            /templateUrl:\s*'.\/(.*?).html',/,
            `templateUrl: './$1.html',\n  styleUrl: './${baseName}.scss',`
        );
    }

    // 4. Lưu lại file TS nếu có thay đổi
    if (isModified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`🔄 Đã cập nhật file gốc: ${filePath}`);
    } else {
        console.log(`⚠️ Không tìm thấy inline template hay styles để tách trong file này.`);
    }
}

// Lấy đường dẫn file từ tham số dòng lệnh
const targetFile = process.argv[2];

if (targetFile) {
    splitAngularComponent(targetFile);
} else {
    console.log('📌 Vui lòng cung cấp đường dẫn file.');
    console.log('💡 Sử dụng: node split-component.js <đường-dẫn-đến-file.component.ts>');
}