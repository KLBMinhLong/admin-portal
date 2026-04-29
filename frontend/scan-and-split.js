const fs = require('fs');
const path = require('path');

// Các thư mục cần bỏ qua để tránh quét nhầm và tăng tốc độ
const IGNORE_DIRS = ['node_modules', 'dist', '.git', '.angular'];

let processedCount = 0;
let modifiedCount = 0;

function processAngularComponent(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const dir = path.dirname(filePath);
    const baseName = path.basename(filePath, '.ts'); // VD: request-list.component

    let isModified = false;

    // Xử lý Template (HTML)
    const templateRegex = /template:\s*`([\s\S]*?)`,?/m;
    const templateMatch = content.match(templateRegex);

    if (templateMatch) {
        const htmlContent = templateMatch[1].trim() + '\n';
        const htmlPath = path.join(dir, `${baseName}.html`);

        fs.writeFileSync(htmlPath, htmlContent, 'utf8');
        content = content.replace(templateRegex, `templateUrl: './${baseName}.html',`);
        isModified = true;
    }

    // Xử lý Styles (SCSS)
    const stylesRegex = /styles:\s*\[\s*`([\s\S]*?)`\s*\],?/m;
    const stylesMatch = content.match(stylesRegex);
    const stylePath = path.join(dir, `${baseName}.scss`);

    if (stylesMatch) {
        const cssContent = stylesMatch[1].trim() + '\n';

        fs.writeFileSync(stylePath, cssContent, 'utf8');
        content = content.replace(stylesRegex, `styleUrl: './${baseName}.scss',`);
        isModified = true;
    } else if (isModified && !content.includes('styleUrl') && !content.includes('styleUrls')) {
        // Nếu có tách HTML nhưng không có style, tự tạo file SCSS rỗng cho đúng chuẩn
        fs.writeFileSync(stylePath, '', 'utf8');
        content = content.replace(
            /templateUrl:\s*'.\/(.*?).html',/,
            `templateUrl: './$1.html',\n  styleUrl: './${baseName}.scss',`
        );
    }

    // Lưu file TS nếu có sự thay đổi
    if (isModified) {
        fs.writeFileSync(filePath, content, 'utf8');
        modifiedCount++;
        console.log(`✅ Đã rã file: ${filePath}`);
    }
}

// Hàm quét đệ quy toàn bộ thư mục
function scanDirectory(targetPath) {
    if (!fs.existsSync(targetPath)) {
        console.error(`❌ Không tìm thấy đường dẫn: ${targetPath}`);
        return;
    }

    const entries = fs.readdirSync(targetPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(targetPath, entry.name);

        if (entry.isDirectory()) {
            // Bỏ qua các thư mục không cần thiết
            if (!IGNORE_DIRS.includes(entry.name)) {
                scanDirectory(fullPath); // Gọi đệ quy để quét thư mục con
            }
        } else if (entry.isFile() && entry.name.endsWith('.component.ts')) {
            processedCount++;
            processAngularComponent(fullPath);
        }
    }
}

// Lấy đường dẫn thư mục từ tham số dòng lệnh, mặc định là 'src/app' nếu không truyền vào
const targetFolder = process.argv[2] || 'src/app';

console.log(`🚀 Bắt đầu quét thư mục: ${targetFolder}...\n`);

scanDirectory(targetFolder);

console.log(`\n🎉 Hoàn tất!`);
console.log(`📊 Tổng số component đã kiểm tra: ${processedCount}`);
console.log(`🛠️ Số component đã được rã thành công: ${modifiedCount}`);