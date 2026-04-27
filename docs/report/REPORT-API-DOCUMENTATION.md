# Report API Documentation

## API Overview

Report API cung cấp 3 endpoints để generate và export các báo cáo dạng PDF cho Purchasing Request Portal.

**Base URL:** `http://localhost:8082/api/v1/reports` (Local Development)  
**Production:** `https://api.adminportal.com/api/v1/reports`

---

## Authentication & Security

### Required Headers
Mọi request phải bao gồm:

```
x-api-key: <your-api-key>
Authorization: Bearer <jwt-token>
Idempotency-Key: <uuid> (optional, for caching)
```

### Permission Requirement
User phải có permission: **`report.view`** hoặc **`report.export`**

These permissions được load từ database at runtime (không hardcode trong token).

---

## Endpoint 1: Export Requests by Status

**Danh sách các yêu cầu mua sắm được group by trạng thái**

### Request

```http
GET /api/v1/reports/requests-by-status?status=PENDING
Host: localhost:8082
x-api-key: key-abc123
Authorization: Bearer eyJhbGc...
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | String | No | Filter by status: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED` |
| | | | Omit to get all requests |

### Success Response

```
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Length: 12345
Content-Disposition: attachment; filename="requests-by-status_2026-01-15.pdf"
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
Cache-Control: private, max-age=3600

[Binary PDF content...]
```

### Error Responses

**401 Unauthorized** - Invalid/missing authentication
```json
{
  "error": "UNAUTHORIZED",
  "message": "Invalid x-api-key or JWT token",
  "timestamp": "2026-01-15T10:30:00Z"
}
```

**403 Forbidden** - Missing permission
```json
{
  "error": "FORBIDDEN",
  "message": "User does not have 'report.view' permission",
  "timestamp": "2026-01-15T10:30:00Z"
}
```

**400 Bad Request** - Invalid status value
```json
{
  "error": "BAD_REQUEST",
  "message": "Invalid status value: INVALID_STATUS",
  "timestamp": "2026-01-15T10:30:00Z"
}
```

### curl Example

```bash
#!/bin/bash

API_KEY="your-api-key"
JWT_TOKEN="your-jwt-token"
IDEMPOTENCY_KEY=$(uuidgen)

curl -X GET "http://localhost:8082/api/v1/reports/requests-by-status?status=PENDING" \
  -H "x-api-key: ${API_KEY}" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Idempotency-Key: ${IDEMPOTENCY_KEY}" \
  -H "Accept: application/pdf" \
  --output requests_by_status.pdf \
  -v

# Check if successful
if [ $? -eq 0 ]; then
  echo "Report generated successfully"
  file requests_by_status.pdf
  ls -lh requests_by_status.pdf
else
  echo "Error generating report"
  exit 1
fi
```

### Python Example

```python
import requests
import uuid
from datetime import datetime

# Configuration
API_BASE_URL = "http://localhost:8082/api/v1/reports"
API_KEY = "your-api-key"
JWT_TOKEN = "your-jwt-token"

def export_requests_by_status(status=None):
    """Export requests by status report"""
    
    headers = {
        "x-api-key": API_KEY,
        "Authorization": f"Bearer {JWT_TOKEN}",
        "Idempotency-Key": str(uuid.uuid4()),
        "Accept": "application/pdf"
    }
    
    params = {}
    if status:
        params["status"] = status
    
    url = f"{API_BASE_URL}/requests-by-status"
    
    response = requests.get(url, headers=headers, params=params, timeout=30)
    
    if response.status_code == 200:
        # Save PDF
        filename = f"requests-by-status-{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        with open(filename, 'wb') as f:
            f.write(response.content)
        print(f"✓ Report saved: {filename} ({len(response.content)} bytes)")
        return filename
    else:
        error = response.json()
        print(f"✗ Error: {error['message']}")
        return None

# Usage
export_requests_by_status("PENDING")
export_requests_by_status()  # All statuses
```

### JavaScript/Node.js Example

```javascript
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const API_KEY = 'your-api-key';
const JWT_TOKEN = 'your-jwt-token';
const API_BASE_URL = 'http://localhost:8082/api/v1/reports';

async function exportRequestsByStatus(status = null) {
    try {
        const headers = {
            'x-api-key': API_KEY,
            'Authorization': `Bearer ${JWT_TOKEN}`,
            'Idempotency-Key': uuidv4(),
            'Accept': 'application/pdf'
        };

        const params = {};
        if (status) {
            params.status = status;
        }

        const response = await axios.get(
            `${API_BASE_URL}/requests-by-status`,
            { headers, params, responseType: 'arraybuffer' }
        );

        const filename = `requests-by-status-${Date.now()}.pdf`;
        fs.writeFileSync(filename, response.data);
        
        console.log(`✓ Report saved: ${filename}`);
        return filename;
    } catch (error) {
        console.error(`✗ Error: ${error.response.data.message}`);
        return null;
    }
}

// Usage
exportRequestsByStatus('PENDING');
exportRequestsByStatus(); // All statuses
```

---

## Endpoint 2: Export Request Detail

**Chi tiết một yêu cầu mua sắm (bao gồm items + approval chain)**

### Request

```http
GET /api/v1/reports/request-detail/123
Host: localhost:8082
x-api-key: key-abc123
Authorization: Bearer eyJhbGc...
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440001
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | Long | Yes | ID của yêu cầu (từ URL path) |

### Success Response

```
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Length: 15234
Content-Disposition: attachment; filename="request-detail_123.pdf"
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440001

[Binary PDF content - includes request header, items table, approval chain]
```

### PDF Content Structure
```
┌─────────────────────────────────┐
│ HEADER SECTION                  │
│ - Request Number                │
│ - Title                         │
│ - Status                        │
│ - Requester, Date               │
│ - Department, Cost Center       │
│ - Total Amount                  │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ ITEMS TABLE                     │
│ ┌───┬────┬───┬────┬──────────┐  │
│ │No │Name│Qty│Price│Total   │  │
│ ├───┼────┼───┼────┼──────────┤  │
│ │1  │Item A│2│50K│100K     │  │
│ │2  │Item B│1│80K│80K      │  │
│ └───┴────┴───┴────┴──────────┘  │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ APPROVAL CHAIN                  │
│ ┌─┬──────┬───────┬───┬──┬────┐  │
│ │#│Role  │User   │Sts│Dt│Note│  │
│ ├─┼──────┼───────┼───┼──┼────┤  │
│ │1│Manager│John  │✓  │.. │ OK│  │
│ │2│Director│Jane │✓  │.. │   │  │
│ │3│CFO   │Mike  │⏳ │  │    │  │
│ └─┴──────┴───────┴───┴──┴────┘  │
└─────────────────────────────────┘
```

### Error Responses

**404 Not Found** - Request ID không tồn tại
```json
{
  "error": "NOT_FOUND",
  "message": "Purchasing request with id 999 not found",
  "timestamp": "2026-01-15T10:30:00Z"
}
```

### curl Example

```bash
curl -X GET "http://localhost:8082/api/v1/reports/request-detail/123" \
  -H "x-api-key: ${API_KEY}" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Idempotency-Key: $(uuidgen)" \
  --output request_detail_123.pdf

# Open PDF
open request_detail_123.pdf  # macOS
# or
xdg-open request_detail_123.pdf  # Linux
# or
start request_detail_123.pdf  # Windows
```

### Python Example

```python
def export_request_detail(request_id):
    """Export detail report for a specific request"""
    
    headers = {
        "x-api-key": API_KEY,
        "Authorization": f"Bearer {JWT_TOKEN}",
        "Idempotency-Key": str(uuid.uuid4()),
        "Accept": "application/pdf"
    }
    
    url = f"{API_BASE_URL}/request-detail/{request_id}"
    response = requests.get(url, headers=headers, timeout=30)
    
    if response.status_code == 200:
        filename = f"request-detail-{request_id}.pdf"
        with open(filename, 'wb') as f:
            f.write(response.content)
        print(f"✓ Report saved: {filename}")
        return filename
    else:
        print(f"✗ Error: {response.status_code} - {response.json()['message']}")
        return None

# Usage
export_request_detail(123)
export_request_detail(456)
```

---

## Endpoint 3: Export Financial Summary

**Tóm tắt tài chính theo phòng ban và trạng thái (trong một khoảng thời gian)**

### Request

```http
GET /api/v1/reports/financial-summary?fromDate=2026-01-01&toDate=2026-12-31
Host: localhost:8082
x-api-key: key-abc123
Authorization: Bearer eyJhbGc...
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440002
```

### Query Parameters

| Parameter | Type | Required | Format | Description |
|-----------|------|----------|--------|-------------|
| `fromDate` | Date | No | yyyy-MM-dd | Start date (default: Jan 1 of current year) |
| `toDate` | Date | No | yyyy-MM-dd | End date (default: today) |

### Success Response

```
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Length: 18765
Content-Disposition: attachment; filename="financial-summary_2026-01-01_to_2026-12-31.pdf"

[Binary PDF content - aggregated by department and status]
```

### PDF Content Structure
```
┌──────────────────────────────────────────────┐
│ HEADER                                       │
│ - Date Range: 01/01/2026 to 31/12/2026      │
│ - Generated: 15/01/2026 10:30:00             │
│ - By: finance.manager@company.com            │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ DEPARTMENT: Phòng IT                         │
│ ┌────┬─────┬──────┬──────────┬────┬─────┐   │
│ │Sts │Count│Items │Total    │Avg │%    │   │
│ ├────┼─────┼──────┼──────────┼────┼─────┤   │
│ │PEN │3    │12    │200M      │67M │25%  │   │
│ │APP │2    │8     │150M      │75M │18%  │   │
│ │REJ │1    │2     │50M       │50M │6%   │   │
│ └────┴─────┴──────┴──────────┴────┴─────┘   │
│ Subtotal: 600M                               │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ DEPARTMENT: Phòng HR                         │
│ [Same structure as above]                    │
│ Subtotal: 400M                               │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ GRAND TOTAL: 1,000M VND                      │
└──────────────────────────────────────────────┘
```

### Error Responses

**400 Bad Request** - Invalid date format
```json
{
  "error": "BAD_REQUEST",
  "message": "Invalid date format. Use yyyy-MM-dd",
  "timestamp": "2026-01-15T10:30:00Z"
}
```

**400 Bad Request** - fromDate > toDate
```json
{
  "error": "BAD_REQUEST",
  "message": "fromDate cannot be after toDate",
  "timestamp": "2026-01-15T10:30:00Z"
}
```

### curl Examples

```bash
# Export for full current year
curl -X GET "http://localhost:8082/api/v1/reports/financial-summary?fromDate=2026-01-01&toDate=2026-12-31" \
  -H "x-api-key: ${API_KEY}" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  --output financial_summary_2026.pdf

# Export for last quarter
curl -X GET "http://localhost:8082/api/v1/reports/financial-summary?fromDate=2026-10-01&toDate=2026-12-31" \
  -H "x-api-key: ${API_KEY}" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  --output financial_summary_q4_2026.pdf

# Export for single month
curl -X GET "http://localhost:8082/api/v1/reports/financial-summary?fromDate=2026-01-01&toDate=2026-01-31" \
  -H "x-api-key: ${API_KEY}" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  --output financial_summary_jan_2026.pdf
```

### Python Example

```python
def export_financial_summary(from_date=None, to_date=None):
    """Export financial summary report"""
    
    from datetime import date, timedelta
    
    # Default: full current year
    today = date.today()
    if from_date is None:
        from_date = date(today.year, 1, 1)
    if to_date is None:
        to_date = today
    
    headers = {
        "x-api-key": API_KEY,
        "Authorization": f"Bearer {JWT_TOKEN}",
        "Idempotency-Key": str(uuid.uuid4()),
        "Accept": "application/pdf"
    }
    
    params = {
        "fromDate": from_date.isoformat(),
        "toDate": to_date.isoformat()
    }
    
    url = f"{API_BASE_URL}/financial-summary"
    response = requests.get(url, headers=headers, params=params, timeout=30)
    
    if response.status_code == 200:
        filename = f"financial-summary-{from_date}-to-{to_date}.pdf"
        with open(filename, 'wb') as f:
            f.write(response.content)
        print(f"✓ Report saved: {filename}")
        return filename
    else:
        error = response.json()
        print(f"✗ Error: {error['message']}")
        return None

# Usage
export_financial_summary()  # Full year
export_financial_summary(
    date(2026, 1, 1),
    date(2026, 3, 31)
)  # Q1
export_financial_summary(
    date(2026, 10, 1),
    date(2026, 12, 31)
)  # Q4
```

---

## Performance & SLA

| Metric | Value |
|--------|-------|
| **Max Response Time** | 5 seconds |
| **Typical Response Time** | 1-2 seconds |
| **PDF Size (avg)** | 50-200 KB |
| **Concurrent Requests** | 10+ supported |
| **Data Volume** | Up to 10,000 records |

### Performance Tips

1. **Use date ranges** để limit data volume
   ```
   // Good - specific date range
   ?fromDate=2026-01-01&toDate=2026-01-31
   
   // Risky - full year might be slow for large datasets
   ?fromDate=2025-01-01&toDate=2026-12-31
   ```

2. **Use status filter** khi chỉ cần một trạng thái
   ```
   // Good - specific status
   /requests-by-status?status=PENDING
   
   // Slower - all statuses
   /requests-by-status
   ```

3. **Cache responses** bằng Idempotency-Key
   ```
   // First request - generates PDF
   Idempotency-Key: abc-123
   
   // Same request within 1 hour - returns cached PDF
   Idempotency-Key: abc-123
   ```

---

## Idempotency Key (Caching)

### Purpose
Tránh generate duplicate PDFs cho cùng một request

### Usage
```bash
# Generate request report
curl -X GET "..." \
  -H "Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000" \
  --output report1.pdf

# Same request → server trả cached result (1 hour TTL)
curl -X GET "..." \
  -H "Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000" \
  --output report2.pdf

# Different key → generate new PDF
curl -X GET "..." \
  -H "Idempotency-Key: 550e8400-e29b-41d4-a716-446655440001" \
  --output report3.pdf
```

### Response Header
```
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
Cache-Control: private, max-age=3600
```

---

## Webhooks / Scheduled Reports

Currently, reports are generated on-demand. For scheduled reports:

**Option 1: External Scheduler**
```bash
#!/bin/bash
# cron job: daily at 8 AM
0 8 * * * /usr/local/bin/generate_daily_report.sh
```

**Option 2: Message Queue**
Schedule report generation via Kafka:
```json
{
  "event": "report.generate",
  "reportType": "financial-summary",
  "fromDate": "2026-01-01",
  "toDate": "2026-12-31",
  "email": "finance@company.com"
}
```

---

## Error Handling

### Common Status Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 200 | OK - PDF generated | Download and use |
| 400 | Bad Request | Check parameters (dates, status values) |
| 401 | Unauthorized | Invalid/missing x-api-key or JWT |
| 403 | Forbidden | User missing `report.view` permission |
| 404 | Not Found | Request ID doesn't exist |
| 500 | Server Error | Template not found, DB issue, etc. |
| 503 | Service Unavailable | Database down, too many concurrent requests |

### Error Response Format

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable description",
  "timestamp": "2026-01-15T10:30:00Z",
  "path": "/api/v1/reports/request-detail/999"
}
```

---

## Rate Limiting

Currently no rate limiting implemented. If heavy usage occurs:

**Recommended limits:**
- 100 requests/minute per API key
- 1000 requests/hour per user

**Headers (future):**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642250400
```

---

## Changelog

### Version 1.0 (2026-01-15)
- ✅ 3 endpoints implemented
- ✅ Jasper Reports integration
- ✅ PDF export support
- ✅ Vietnamese text support (DejaVu Sans)
- ✅ Idempotency caching

### Planned (v2.0)
- [ ] Excel export (XLSX)
- [ ] CSV export
- [ ] Email delivery
- [ ] Scheduled reports
- [ ] Custom templates via UI
- [ ] Data visualization (charts)

---

## Support & Contact

**Issues:**
1. Check logs: `/logs/domain-service.log`
2. Review troubleshooting docs: `REPORT-SYSTEM-GUIDE.md`
3. Contact: devops@company.com

**API Key Management:**
- Request new key: `https://admin.company.com/api-keys`
- Revoke key: Contact admin

---

**Documentation Version:** 1.0  
**Last Updated:** 2026-01-15  
**API Version:** 1.0
