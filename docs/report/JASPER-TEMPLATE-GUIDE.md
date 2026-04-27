# Jasper Reports Template Editing Guide

## Tóm tắt

Hướng dẫn chi tiết về cách mở, chỉnh sửa, và deploy các Jasper Report templates (.jrxml) trong Admin Portal.

**3 templates hiện tại:**
1. `RequestsByStatus.jrxml` - Danh sách yêu cầu mua sắm theo trạng thái
2. `RequestDetail.jrxml` - Chi tiết một yêu cầu (bao gồm items + approval chain)
3. `FinancialSummary.jrxml` - Tóm tắt tài chính theo phòng ban

---

## 1. Chuẩn bị Môi trường

### 1.1 Cài đặt Jasper Studio Community Edition

**Bước 1: Tải Jasper Studio**
- Truy cập: https://sourceforge.net/projects/jasperstudio/files/
- Chọn phiên bản gần nhất (ví dụ: `jasperreports-studio-6.18.1-win32.x86_64.zip`)
- Tải xuống và giải nén

**Bước 2: Cài đặt Java JDK**
- Jasper Studio cần Java 11+ để chạy
- Tải từ: https://www.oracle.com/java/technologies/downloads/
- Cài đặt và đặt `JAVA_HOME` trong environment variables

**Bước 3: Chạy Jasper Studio**
```bash
# Windows
cd <jasper-studio-path>/JasperStudio
JasperStudio.exe

# Linux/Mac
cd <jasper-studio-path>/JasperStudio
./JasperStudio
```

### 1.2 Cài đặt Visual Studio Code Extensions (Tùy chọn)

Nếu muốn edit XML trực tiếp:
- Cài extension: "XML Tools" của Josh Johnson
- Cài extension: "Prettier XML" cho formatting

---

## 2. Mở và Sửa Template trong Jasper Studio

### 2.1 Mở một Template

**Phương pháp 1: Từ Jasper Studio**
1. Mở Jasper Studio
2. Click `File → Open File`
3. Navigate to: `admin-portal/services/domain-service/src/main/resources/reports/`
4. Chọn file `.jrxml` (ví dụ: `RequestsByStatus.jrxml`)

**Phương pháp 2: Drag & Drop**
1. Mở File Explorer
2. Navigate to folder chứa `.jrxml`
3. Drag file vào cửa sổ Jasper Studio
4. File sẽ tự động mở

### 2.2 Giao diện Jasper Studio

```
┌─────────────────────────────────────────────┐
│ Jasper Studio IDE                           │
├─────────────┬─────────────────────────────┤
│   Palette   │     Design Area (Canvas)    │
│  (Fields,   │   ┌───────────────────────┐ │
│  Bands,     │   │ Report Template Here   │ │
│  Elements)  │   │ (Resize elements)      │ │
│             │   └───────────────────────┘ │
├─────────────┼─────────────────────────────┤
│ Properties Panel (Right Side)              │
│ - General                                  │
│ - Text Properties                          │
│ - Border & Background                      │
└─────────────────────────────────────────────┘
```

**Các phần chính:**
- **Palette** (bên trái): Các elements sẵn có (Text, Rectangle, Image, etc.)
- **Design Area** (giữa): Kéo/thả elements vào đây
- **Properties Panel** (bên phải): Chỉnh sửa properties của element đang select

### 2.3 Hiểu cấu trúc Template

#### Bands (Dải)
Mỗi template gồm các "bands" (dải) khác nhau:

| Band | Ý Nghĩa | Ví dụ |
|------|---------|-------|
| **Title** | Hiển thị một lần ở đầu báo cáo | Header với tên báo cáo |
| **Page Header** | Hiển thị ở đầu mỗi trang | Logo, ngày tháng |
| **Column Header** | Headers của các cột dữ liệu | Tên cột bảng |
| **Detail** | Dữ liệu chính, lặp lại mỗi row | Các dòng yêu cầu |
| **Group Footer** | Tính tổng per group | Tổng per trạng thái |
| **Page Footer** | Hiển thị ở cuối mỗi trang | Số trang |
| **Summary** | Một lần ở cuối báo cáo | Tổng cộng toàn bộ |

#### Fields (Trường dữ liệu)
Các field được khai báo ở đầu template, ví dụ:
```xml
<field name="requestNumber" class="java.lang.String"/>
<field name="totalAmount" class="java.math.BigDecimal"/>
```

Để sử dụng trong template: `$F{requestNumber}`, `$F{totalAmount}`

#### Parameters (Tham số)
Tham số truyền vào khi generate report, ví dụ:
```xml
<parameter name="reportTitle" class="java.lang.String">
    <defaultValue>"Danh sách Yêu cầu"</defaultValue>
</parameter>
```

Sử dụng: `$P{reportTitle}`

#### Variables (Biến)
Biến tính toán trong báo cáo, ví dụ:
```xml
<variable name="totalByStatus" class="java.math.BigDecimal" 
           calculation="Sum">
    <variableExpression><![CDATA[$F{totalAmount}]]></variableExpression>
</variable>
```

Sử dụng: `$V{totalByStatus}`

### 2.4 Sửa Template - Ví dụ Thực Tế

**Ví dụ: Thêm trường mới "Người phê duyệt" vào RequestsByStatus**

1. **Thêm Field mới** (trong phần Fields)
   ```xml
   <field name="approverName" class="java.lang.String"/>
   ```

2. **Thêm cột vào Column Header**
   - Mở file `.jrxml` hoặc edit trong Design View
   - Scroll đến `columnHeader` band
   - Click `Insert → Text Field`
   - Điều chỉnh vị trí và kích thước
   - Set `Text: "Người phê duyệt"`

3. **Thêm cột vào Detail Band**
   - Tương tự như trên
   - Set `Text Expression: $F{approverName}`

4. **Chỉnh sửa XML trực tiếp** (Khuyến nghị)
   - Click `Source` tab ở dưới Design View
   - Tìm section `<columnHeader>` và `<detail>`
   - Thêm các `<textField>` elements

### 2.5 Thay đổi Định dạng (Format)

#### Đổi Màu Nền (Background Color)
1. Click element (Rectangle hoặc Static Text)
2. Properties panel → Click tab "Background"
3. Chọn color mới
4. Hoặc edit XML: `<reportElement ... backcolor="#FFFFFF" />`

#### Đổi Font & Kích thước
1. Select text element
2. Properties panel → "Text" tab
3. Điều chỉnh:
   - Font Name: Khuyến nghị `DejaVu Sans` cho Vietnamese
   - Font Size: Ví dụ 9, 10, 11
   - Bold/Italic: Check box

#### Đổi Alignment (Căn lề)
1. Select element
2. Properties panel → "Text" tab
3. Alignment: Left, Center, Right, Justified

#### Thêm Border (Đường viền)
1. Select element
2. Properties panel → "Border" tab
3. Width: độ dày đường viền
4. Color: màu đường viền
5. Style: Solid, Dashed, Dotted

---

## 3. Testing Template (Trước khi Deploy)

### 3.1 Compile Template

**Từ Jasper Studio:**
1. Mở template
2. Click `File → Compile`
3. Nếu không lỗi, sẽ tạo file `.jasper` (compiled version)

**Từ Command Line:**
```bash
# Cần Jasper Reports library
java -cp "lib/*" net.sf.jasperreports.cli.JasperCompile RequestsByStatus.jrxml
```

### 3.2 Preview Report

**Từ Jasper Studio:**
1. Mở template
2. Click `File → Preview (F8)`
3. Một cửa sổ sẽ hiển thị sample data

**Lưu ý:** Preview yêu cầu database connection hoặc sample data source

### 3.3 Kiểm tra XML Syntax

```bash
# Sử dụng XML validator (online hoặc local)
xmllint --noout RequestsByStatus.jrxml

# Hoặc trong VS Code:
# Cài "XML Tools" extension
# Right-click → Validate XML
```

---

## 4. Debugging & Lỗi Thường Gặp

### Lỗi 1: "Template not found"
**Nguyên nhân:** File `.jrxml` không ở đúng vị trí
**Giải pháp:** 
- Kiểm tra file path: `src/main/resources/reports/`
- Rebuild project: `mvn clean install`

### Lỗi 2: "Invalid XML"
**Nguyên nhân:** Cú pháp XML sai (thiếu closing tag, attribute không hợp lệ)
**Giải pháp:**
- Mở file bằng XML validator
- Kiểm tra matching `<opening>` và `</closing>` tags
- Sử dụng Jasper Studio → File → Compile (sẽ báo lỗi rõ)

### Lỗi 3: "Field not found"
**Nguyên nhân:** Dùng field chưa khai báo, hoặc typo tên field
**Giải pháp:**
```xml
<!-- Đảm bảo field được khai báo -->
<field name="requestNumber" class="java.lang.String"/>

<!-- Sử dụng đúng tên -->
$F{requestNumber}  <!-- ✓ Đúng -->
$F{requestnumber}  <!-- ✗ Sai (case-sensitive) -->
```

### Lỗi 4: "Unable to get byte code for class"
**Nguyên nhân:** Java expression (trong `<![CDATA[...]]>`) sai cú pháp
**Giải pháp:**
```xml
<!-- ✓ Đúng -->
<variableExpression><![CDATA[$F{totalAmount}]]></variableExpression>

<!-- ✗ Sai -->
<variableExpression>$F{totalAmount}</variableExpression>
<variableExpression>CDATA[$F{totalAmount}]</variableExpression>
```

### Lỗi 5: "Font not found" (Vietnamese text)
**Nguyên nhân:** Font không hỗ trợ Unicode
**Giải pháp:**
- Sử dụng `fontName="DejaVu Sans"` (recommended)
- Hoặc `fontName="Liberation Sans"`
- Tránh: Arial, Times New Roman (có vấn đề với Vietnamese)

---

## 5. Export Template (Compile & Deploy)

### 5.1 Compile từ Studio
```bash
# Jasper Studio có built-in compiler
File → Compile

# Hoặc command line (nếu install Maven)
mvn compile
```

### 5.2 Output Files

After compiling, sẽ có 2 files:
- `RequestsByStatus.jrxml` - Source template (XML)
- `RequestsByStatus.jasper` - Compiled template (binary)

**Application sẽ dùng file `.jrxml`, không cần `.jasper`**
- Vì `JasperReportCompiler` compile at runtime

### 5.3 Deploy vào Project

```bash
# Copy file .jrxml vào:
cp RequestsByStatus.jrxml \
   admin-portal/services/domain-service/src/main/resources/reports/

# Rebuild project
cd admin-portal
mvn clean install
```

---

## 6. Best Practices khi Sửa Template

✅ **Nên làm:**
- Đặt tên field/parameter rõ ràng: `requestNumber`, `totalAmount` (không `req`, `amt`)
- Comment trong XML để giải thích: `<!-- Group by department -->`
- Dùng `DejaVu Sans` font cho Vietnamese text
- Test compile sau mỗi thay đổi
- Backup file `.jrxml` trước khi edit lớn

❌ **Không nên làm:**
- Xóa field/parameter được sử dụng mà không update all references
- Thay đổi XML trực tiếp nếu không hiểu cấu trúc (dùng Jasper Studio)
- Sử dụng font không hỗ trợ Unicode cho Vietnamese
- Hardcode values thay vì dùng parameters
- Thêm quá nhiều calculations (làm slow report generation)

---

## 7. Advanced Topics

### 7.1 Thêm Images/Logo
```xml
<image>
    <reportElement x="0" y="0" width="100" height="50" uuid="logo"/>
    <imageExpression><![CDATA["images/logo.png"]]></imageExpression>
</image>
```

### 7.2 Thêm Barcodes/QR Codes
1. Cần thêm library: `barbecue-<version>.jar`
2. Template XML:
```xml
<image>
    <reportElement x="0" y="0" width="100" height="50"/>
    <imageExpression><![CDATA[net.sourceforge.barbecue.BarcodeFactory
        .createEAN13("123456789012").getImage()]]></imageExpression>
</image>
```

### 7.3 Conditional Formatting (If-Then-Else)
```xml
<textField>
    <reportElement x="10" y="0" width="100" height="15"
        forecolor="$F{status}.equals("APPROVED") ? java.awt.Color.GREEN : java.awt.Color.RED"/>
    <textFieldExpression><![CDATA[$F{status}]]></textFieldExpression>
</textField>
```

### 7.4 Subreports
Nhúng một template khác vào template chính:
```xml
<subreport>
    <reportElement x="0" y="0" width="555" height="100" uuid="sub-report"/>
    <subreportParameter name="SUBREPORT_DIR">
        <subreportParameterExpression><![CDATA[$P{SUBREPORT_DIR}]]>
        </subreportParameterExpression>
    </subreportParameter>
    <dataSourceExpression><![CDATA[new net.sf.jasperreports.engine
        .data.JRBeanCollectionDataSource($F{items})]]></dataSourceExpression>
    <subreportExpression><![CDATA[$P{SUBREPORT_DIR} + "itemsReport.jasper"]]>
    </subreportExpression>
</subreport>
```

---

## 8. Tools & Resources

| Tool | Mục đích | Link |
|------|---------|------|
| Jasper Studio Community | Design templates | https://sourceforge.net/projects/jasperstudio/ |
| JasperReports Library | Generate PDFs | https://github.com/TIBCOSoftware/jasperreports |
| Online JasperReports Editor | Quick edit | https://github.com/interlockledger/jaspersample |
| XML Validator | Check syntax | https://www.xmlvalidation.com/ |

---

## 9. Support & Troubleshooting

**Nếu gặp vấn đề:**

1. **Check logs** - Xem application logs:
   ```bash
   tail -f logs/domain-service.log | grep -i "jasper\|report"
   ```

2. **Validate XML** - Sử dụng online validator:
   ```bash
   curl -F "xml=@RequestsByStatus.jrxml" https://www.xmlvalidation.com/
   ```

3. **Recompile** - Clear cache và recompile:
   ```bash
   mvn clean compile
   java -cp target/classes:target/lib/* com.adminportal.domain.infrastructure.jasper.JasperReportCompiler
   ```

4. **Jasper Documentation** - Tham khảo official docs:
   - https://jasperreports.sourceforge.net/
   - https://github.com/TIBCOSoftware/jasperreports/wiki

---

**Phiên bản:** 1.0  
**Cập nhật lần cuối:** 2026-01-15  
**Tác giả:** Admin Portal Development Team
