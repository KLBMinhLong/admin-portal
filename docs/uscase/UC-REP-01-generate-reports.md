# UC-REP-01 - Tao bao cao PDF

## Goal
Xuat bao cao Jasper cho danh sach yeu cau, chi tiet, va tong hop tai chinh.

## Actors
- Primary: Finance Manager, Admin
- Secondary: Domain Service, JasperReports

## Preconditions
- User co permission `report.view` hoac `report.export`.
- Du lieu request ton tai.

## Triggers
- `GET /api/v1/reports/requests-by-status`
- `GET /api/v1/reports/request-detail/{id}`
- `GET /api/v1/reports/financial-summary`

## Main Flow
1. Validate permission report.
2. Lay du lieu theo filter.
3. Mapping du lieu vao report model.
4. Fill Jasper template (`.jrxml`/compiled template).
5. Export PDF bytes.
6. Tra file stream voi content-type `application/pdf`.

## Alternate Flows
- A1: Khong co du lieu -> tra report rong co thong bao.
- A2: Template loi -> `500 REPORT_TEMPLATE_ERROR`.
- A3: Khong du quyen -> `403 ACCESS_DENIED`.

## Edge Cases
- Khoang ngay qua lon -> bat pagination/chia batch de tranh memory peak.
- Unicode tieng Viet trong PDF -> can font support.

## Acceptance Criteria
- PDF mo duoc, khong vo layout.
- So lieu tong hop khop DB.
- API response time trong nguong cho phep (vi du <5s voi report vua).

## Implementation Tasks
1. Tao `ReportService` voi 3 method export.
2. Tao templates Jasper.
3. Tao report endpoints.
4. Them test so khop tong tien.
