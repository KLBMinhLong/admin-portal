# Design System — Purchasing Request Portal

> Tài liệu thiết kế UI/UX chính thức. Tất cả màn hình trong hệ thống **PHẢI** tuân theo các quy tắc trong file này để đảm bảo tính nhất quán.

---

## 1. Design Philosophy

| Thuộc tính | Giá trị |
|---|---|
| **Phong cách** | Flat Design — 2D, minimalist, clean lines, typography-focused |
| **Cảm nhận** | Chuyên nghiệp, hiện đại, dịu nhẹ, đáng tin cậy |
| **Ngành** | Ngân hàng / Fintech — nội bộ |
| **Mục tiêu** | Giảm cognitive load, tối ưu workflow phê duyệt |

### Nguyên tắc cốt lõi
1. **Whitespace first** — Ưu tiên khoảng trống, tránh nhồi nhét
2. **Consistency over creativity** — Đồng nhất quan trọng hơn sáng tạo
3. **Progressive disclosure** — Chỉ hiện thông tin cần thiết tại thời điểm đó
4. **Feedback always** — Mọi hành động phải có phản hồi rõ ràng

---

## 2. Color Palette

Sử dụng bảng màu **B2B Professional** — navy chủ đạo, xanh dương CTA, nền sáng dịu nhẹ.

### 2.1 Core Colors

| Role | Hex | Tailwind Class | Mô tả |
|------|-----|----------------|--------|
| **Primary** | `#0F172A` | `slate-900` | Sidebar, navbar, tiêu đề chính |
| **Primary Light** | `#334155` | `slate-700` | Hover state sidebar, active menu |
| **Secondary** | `#64748B` | `slate-500` | Text phụ, icon, muted label |
| **CTA / Accent** | `#2563EB` | `blue-600` | Button chính, link, active state |
| **CTA Hover** | `#1D4ED8` | `blue-700` | Hover cho CTA buttons |
| **Background** | `#F8FAFC` | `slate-50` | Nền chính của content area |
| **Surface** | `#FFFFFF` | `white` | Card, modal, form background |
| **Border** | `#E2E8F0` | `slate-200` | Viền card, divider, table border |
| **Text Primary** | `#0F172A` | `slate-900` | Heading, body text chính |
| **Text Secondary** | `#475569` | `slate-600` | Mô tả, placeholder, caption |
| **Text Muted** | `#94A3B8` | `slate-400` | Timestamp, hint (chỉ dùng cho text rất phụ) |

### 2.2 Semantic Colors

| Role | Hex | Tailwind Class | Sử dụng |
|------|-----|----------------|---------|
| **Success** | `#16A34A` | `green-600` | Approved, completed, toast success |
| **Success BG** | `#F0FDF4` | `green-50` | Background badge/alert success |
| **Warning** | `#D97706` | `amber-600` | Pending approval, attention needed |
| **Warning BG** | `#FFFBEB` | `amber-50` | Background badge/alert warning |
| **Error** | `#DC2626` | `red-600` | Rejected, validation error, toast error |
| **Error BG** | `#FEF2F2` | `red-50` | Background badge/alert error |
| **Info** | `#2563EB` | `blue-600` | Draft, thông tin chung |
| **Info BG** | `#EFF6FF` | `blue-50` | Background badge/alert info |

### 2.3 Status Mapping (Request Workflow)

| Status | Badge Color | Text Color | Background |
|--------|-------------|------------|------------|
| `DRAFT` | `blue-600` | `blue-700` | `blue-50` |
| `PENDING_APPROVAL` | `amber-600` | `amber-700` | `amber-50` |
| `APPROVED` | `green-600` | `green-700` | `green-50` |
| `REJECTED` | `red-600` | `red-700` | `red-50` |
| `CANCELLED` | `slate-500` | `slate-600` | `slate-100` |

---

## 3. Typography

| Thuộc tính | Giá trị |
|---|---|
| **Font Family** | Inter |
| **Fallback** | `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` |
| **Google Fonts** | `https://fonts.google.com/share?selection.family=Inter:wght@300;400;500;600;700` |

### 3.1 Type Scale

| Element | Size | Weight | Line Height | Tailwind |
|---------|------|--------|-------------|----------|
| Page Title (h1) | 24px | 700 (Bold) | 32px | `text-2xl font-bold` |
| Section Title (h2) | 20px | 600 (Semibold) | 28px | `text-xl font-semibold` |
| Card Title (h3) | 16px | 600 (Semibold) | 24px | `text-base font-semibold` |
| Body | 14px | 400 (Regular) | 20px | `text-sm` |
| Small / Caption | 12px | 400 (Regular) | 16px | `text-xs` |
| Button | 14px | 500 (Medium) | 20px | `text-sm font-medium` |
| Badge | 12px | 500 (Medium) | 16px | `text-xs font-medium` |
| Monospace (code) | 13px | 400 | 20px | `font-mono text-[13px]` |

### 3.2 SCSS Import

```scss
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
```

---

## 4. Layout System

### 4.1 Shell Layout (Sidebar + Content)

```
┌──────────────────────────────────────────────────┐
│ ┌──────────┐ ┌──────────────────────────────────┐ │
│ │          │ │  Header / Topbar                 │ │
│ │ Sidebar  │ ├──────────────────────────────────┤ │
│ │ (fixed)  │ │                                  │ │
│ │ 256px    │ │  Content Area (scrollable)       │ │
│ │          │ │  max-w: 100%                     │ │
│ │          │ │  padding: 24px                   │ │
│ │          │ │                                  │ │
│ └──────────┘ └──────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

| Thành phần | Kích thước | Tailwind |
|---|---|---|
| Sidebar rộng | `256px` (16rem) | `w-64` |
| Sidebar thu gọn | `72px` (4.5rem) | `w-[72px]` |
| Header cao | `64px` (4rem) | `h-16` |
| Content padding | `24px` | `p-6` |
| Card gap | `24px` | `gap-6` |
| Card border radius | `12px` | `rounded-xl` |
| Card padding | `20-24px` | `p-5` hoặc `p-6` |

### 4.2 Breakpoints

| Breakpoint | Min Width | Sidebar | Tailwind |
|---|---|---|---|
| Mobile | < 768px | Ẩn hoàn toàn, overlay | `md:` |
| Tablet | 768-1024px | Thu gọn (icon only) | `lg:` |
| Desktop | >= 1024px | Mở đầy đủ | Default |
| Wide | >= 1440px | Mở đầy đủ | `xl:` |

### 4.3 Responsive Grid

```html
<!-- Dashboard cards -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

<!-- Form layout -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-4">

<!-- Content + aside -->
<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div class="lg:col-span-2"><!-- Main --></div>
  <div><!-- Aside --></div>
</div>
```

---

## 5. Component Specs

### 5.1 Sidebar

```
┌────────────────────────┐
│  [Logo] Admin Portal   │  h-16, border-b
├────────────────────────┤
│  ● Dashboard           │  Active: bg-blue-50 text-blue-600
│  ○ Yêu cầu mua sắm    │  Normal: text-slate-600
│  ○ Phê duyệt           │  Hover: bg-slate-100
│  ○ Báo cáo             │
├────────────────────────┤
│  QUẢN TRỊ              │  Section label: text-xs uppercase
│  ○ Người dùng          │
│  ○ Cấu hình            │
├────────────────────────┤
│                        │
│  [Avatar] Nguyễn Văn A │  Sticky bottom
│  Finance Manager       │
│  [Logout]              │
└────────────────────────┘
```

| Thuộc tính | Giá trị |
|---|---|
| Background | `white` (nền trắng, border phải) |
| Border right | `1px solid slate-200` |
| Menu item height | `40px` |
| Menu item padding | `px-4 py-2` |
| Icon size | `20px` (w-5 h-5) |
| Active state | `bg-blue-50 text-blue-600 font-medium` |
| Hover state | `bg-slate-50 text-slate-900` |
| Section label | `text-xs font-semibold text-slate-400 uppercase tracking-wider` |
| Icon library | **Lucide Icons** (Angular: `lucide-angular`) |

### 5.2 Header / Topbar

```
┌──────────────────────────────────────────────────┐
│  ☰  Page Title                    🔔  [Avatar] ▼ │
└──────────────────────────────────────────────────┘
```

| Thuộc tính | Giá trị |
|---|---|
| Background | `white` |
| Height | `64px` |
| Border bottom | `1px solid slate-200` |
| Page title | `text-xl font-semibold text-slate-900` |
| Shadow | Không shadow (chỉ border) |
| Right section | Notification bell + User dropdown |

### 5.3 Buttons

| Variant | Background | Text | Border | Hover |
|---------|-----------|------|--------|-------|
| **Primary** | `blue-600` | `white` | none | `blue-700` |
| **Secondary** | `white` | `slate-700` | `slate-300` | `slate-50` |
| **Danger** | `red-600` | `white` | none | `red-700` |
| **Ghost** | transparent | `slate-600` | none | `slate-100` |
| **Disabled** | `slate-100` | `slate-400` | none | — |

**Quy tắc chung:**
- Border radius: `rounded-lg` (8px)
- Padding: `px-4 py-2` (md), `px-3 py-1.5` (sm)
- Font: `text-sm font-medium`
- Transition: `transition-colors duration-200`
- **LUÔN** có `cursor-pointer`
- Focus ring: `focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`

### 5.4 Cards

| Thuộc tính | Giá trị |
|---|---|
| Background | `white` |
| Border | `1px solid slate-200` |
| Border radius | `rounded-xl` (12px) |
| Padding | `p-5` hoặc `p-6` |
| Shadow | `shadow-sm` (rất nhẹ) |
| Hover (nếu clickable) | `hover:shadow-md transition-shadow cursor-pointer` |

### 5.5 Form Inputs

| Thuộc tính | Giá trị |
|---|---|
| Height | `40px` |
| Border | `1px solid slate-300` |
| Border radius | `rounded-lg` (8px) |
| Padding | `px-3 py-2` |
| Focus | `ring-2 ring-blue-500 border-blue-500` |
| Error | `ring-2 ring-red-500 border-red-500` |
| Label | `text-sm font-medium text-slate-700 mb-1` |
| Error message | `text-xs text-red-600 mt-1` |
| **LUÔN có label** — không chỉ dùng placeholder |

### 5.6 Data Tables

| Thuộc tính | Giá trị |
|---|---|
| Header bg | `slate-50` |
| Header text | `text-xs font-semibold text-slate-500 uppercase tracking-wider` |
| Row border | `border-b border-slate-100` |
| Row hover | `hover:bg-slate-50` |
| Cell padding | `px-4 py-3` |
| Empty state | Icon + text "Không có dữ liệu", centered |
| Mobile | `overflow-x-auto` wrapper |

### 5.7 Badges / Status Chips

```html
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
  Approved
</span>
```

### 5.8 Toast / Notification

| Variant | Icon | Border Left | Background |
|---------|------|-------------|------------|
| Success | CheckCircle | `green-500` | `white` |
| Error | XCircle | `red-500` | `white` |
| Warning | AlertTriangle | `amber-500` | `white` |
| Info | Info | `blue-500` | `white` |

Position: `fixed top-4 right-4`, z-index: `50`, auto-dismiss: `5s`

---

## 6. Motion and Animation

| Hiệu ứng | Duration | Easing | Sử dụng |
|---|---|---|---|
| Hover transitions | `200ms` | `ease` | Button, link, menu |
| Modal enter | `300ms` | `ease-out` | Dialog, sheet |
| Modal exit | `200ms` | `ease-in` | Dialog, sheet |
| Toast slide in | `300ms` | `ease-out` | Notification |
| Skeleton pulse | `2s` | `ease-in-out` | Loading state |
| Page transition | `150ms` | `ease` | Route change |

**Quy tắc:**
- **KHÔNG** dùng animation liên tục (bounce, pulse) cho decorative elements
- **PHẢI** tôn trọng `prefers-reduced-motion: reduce`
- Skeleton loading thay vì blank screen

---

## 7. Chart Guidelines

Sử dụng cho Dashboard/Reports.

| Dữ liệu | Chart Type | Library |
|---|---|---|
| Trend theo thời gian | Line Chart / Area Chart | Chart.js hoặc ApexCharts |
| So sánh categories | Bar Chart | Chart.js |
| Tỷ lệ phần trăm | Donut Chart (max 5 items) | Chart.js |
| KPI single value | Stat Card (không cần chart) | Custom component |

**Màu chart:** Sử dụng palette Blue - Indigo - Violet cho multi-series:
`#2563EB`, `#4F46E5`, `#7C3AED`, `#9333EA`, `#64748B`

---

## 8. Spacing System

Sử dụng bội số của `4px` (Tailwind default):

| Token | Value | Tailwind | Sử dụng |
|-------|-------|----------|---------|
| `xs` | 4px | `1` | Giữa icon và text |
| `sm` | 8px | `2` | Giữa related items |
| `md` | 16px | `4` | Section padding nhỏ |
| `lg` | 24px | `6` | Card padding, section gap |
| `xl` | 32px | `8` | Page padding |
| `2xl` | 48px | `12` | Section gap lớn |

---

## 9. Icon System

| Thuộc tính | Giá trị |
|---|---|
| Library | **Lucide Icons** (`lucide-angular`) |
| Default size | `20px` (w-5 h-5) |
| Color | Inherit text color |
| Stroke width | `1.5` hoặc `2` |

**KHÔNG** sử dụng emoji làm icon UI. **LUÔN** dùng SVG icon.

---

## 10. Accessibility Checklist

- [x] Tất cả image có `alt` text
- [x] Form input có label liên kết
- [x] Color contrast tối thiểu 4.5:1 (WCAG AA)
- [x] Focus ring visible cho keyboard navigation
- [x] Skip link "Skip to main content" ở đầu page
- [x] `aria-label` cho interactive elements không có text
- [x] Tab order logic (trái-phải, trên-dưới)
- [x] `prefers-reduced-motion` respected

---

## 11. File Structure (Angular)

```
src/app/
├── core/
│   ├── auth/              # Auth guard, token service
│   ├── guards/            # Route guards
│   ├── interceptors/      # HTTP interceptors
│   ├── models/            # Shared interfaces/enums
│   ├── security/          # AES encryption service
│   └── services/          # Singleton services (API, etc.)
├── shared/
│   ├── components/        # Reusable components
│   │   ├── sidebar/
│   │   ├── header/
│   │   ├── toast/
│   │   ├── status-badge/
│   │   ├── confirm-dialog/
│   │   ├── data-table/
│   │   └── skeleton-loader/
│   ├── directives/
│   └── pipes/
├── features/
│   ├── auth/              # Login, register, forgot-password
│   ├── dashboard/         # Dashboard overview
│   └── management/        # Purchasing requests, approvals
├── app.component.ts
├── app.config.ts
└── app.routes.ts
```

---

## 12. Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#0F172A',
          light: '#334155',
        },
        accent: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          light: '#EFF6FF',
        },
      },
    },
  },
  plugins: [],
};
```

---

## 13. Pre-Delivery Checklist

Trước khi merge code UI, kiểm tra:

### Visual
- [ ] Không có emoji dùng làm icon (sử dụng Lucide SVG)
- [ ] Tất cả icon từ cùng 1 bộ (Lucide)
- [ ] Hover state không gây layout shift
- [ ] Sử dụng Tailwind class trực tiếp

### Interaction
- [ ] Tất cả element clickable có `cursor-pointer`
- [ ] Hover state có visual feedback rõ ràng
- [ ] Transition smooth (150-300ms)
- [ ] Focus state visible cho keyboard navigation

### Responsive
- [ ] Test ở 375px, 768px, 1024px, 1440px
- [ ] Sidebar responsive (ẩn mobile, thu gọn tablet)
- [ ] Table có `overflow-x-auto`
- [ ] Không horizontal scroll trên mobile

### Accessibility
- [ ] Light mode text contrast 4.5:1 minimum
- [ ] Form inputs có label
- [ ] `prefers-reduced-motion` respected
- [ ] Skip link ở đầu page
