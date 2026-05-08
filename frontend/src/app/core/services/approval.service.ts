import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { inject } from '@angular/core';
import { API_URL } from '../tokens/config.token';
import { PurchasingRequest } from '../models/request.models';
import { ApiResponse } from '../models/auth.models';

export interface ApprovalActionDto {
  comment?: string;
}

/**
 * UC-FE-03 Task 1: ApprovalService
 * Gọi API domain-service cho approval flow.
 */
@Injectable({ providedIn: 'root' })
export class ApprovalService {
  private readonly apiUrl = `${inject(API_URL)}/approvals`;
  private readonly requestUrl = `${inject(API_URL)}/requests`;

  constructor(private http: HttpClient) {}

  /** Lấy danh sách requests chờ duyệt */
  getPendingApprovals(): Observable<PurchasingRequest[]> {
    return this.http
      .get<ApiResponse<PurchasingRequest[]> | PurchasingRequest[]>(this.requestUrl, {
        params: new HttpParams().set('status', 'PENDING_APPROVAL'),
      })
      .pipe(map((res) => ('data' in (res as any) ? (res as ApiResponse<PurchasingRequest[]>).data : (res as PurchasingRequest[]))));
  }

  /** Approve một request */
  approve(requestId: number, comment?: string): Observable<PurchasingRequest> {
    const dto: ApprovalActionDto = { comment };
    return this.http
      .post<ApiResponse<PurchasingRequest> | PurchasingRequest>(`${this.apiUrl}/${requestId}/approve`, dto)
      .pipe(map((res) => ('data' in (res as any) ? (res as ApiResponse<PurchasingRequest>).data : (res as PurchasingRequest))));
  }

  /** Reject một request */
  reject(requestId: number, comment: string): Observable<PurchasingRequest> {
    const dto: ApprovalActionDto = { comment };
    return this.http
      .post<ApiResponse<PurchasingRequest> | PurchasingRequest>(`${this.apiUrl}/${requestId}/reject`, dto)
      .pipe(map((res) => ('data' in (res as any) ? (res as ApiResponse<PurchasingRequest>).data : (res as PurchasingRequest))));
  }
}
