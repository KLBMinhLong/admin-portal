import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export interface ReportType {
  id: string;
  label: string;
  description: string;
  icon: string;
}

export const REPORT_TYPES: ReportType[] = [
  {
    id: 'requests-by-status',
    label: 'Danh sách yêu cầu theo trạng thái',
    description: 'Xuất danh sách tất cả yêu cầu mua sắm, lọc theo trạng thái.',
    icon: 'list',
  },
  {
    id: 'request-detail',
    label: 'Chi tiết yêu cầu',
    description: 'Xuất báo cáo chi tiết cho một yêu cầu cụ thể.',
    icon: 'file',
  },
  {
    id: 'financial-summary',
    label: 'Tóm tắt tài chính',
    description: 'Báo cáo tổng hợp tài chính theo khoảng thời gian.',
    icon: 'chart',
  },
];

/**
 * UC-FE-03 Task 2: ReportService
 * Gọi API domain-service cho report generation (PDF download).
 */
@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly apiUrl = `${environment.apiBaseUrl}/reports`;

  constructor(private http: HttpClient) {}

  /** Download PDF: Requests by status */
  exportRequestsByStatus(status?: string): Observable<Blob> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get(`${this.apiUrl}/requests-by-status`, {
      params,
      responseType: 'blob',
    });
  }

  /** Download PDF: Request detail */
  exportRequestDetail(requestId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/request-detail/${requestId}`, {
      responseType: 'blob',
    });
  }

  /** Download PDF: Financial summary */
  exportFinancialSummary(fromDate?: string, toDate?: string): Observable<Blob> {
    let params = new HttpParams();
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    return this.http.get(`${this.apiUrl}/financial-summary`, {
      params,
      responseType: 'blob',
    });
  }
}
