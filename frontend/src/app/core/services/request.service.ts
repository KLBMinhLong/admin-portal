import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { inject } from '@angular/core';
import { API_URL } from '../tokens/config.token';
import { CreateRequestDto, PurchasingRequest } from '../models/request.models';
import { ApiResponse } from '../models/auth.models';

/**
 * UC-FE-02 Task 2: RequestService
 * Gọi API domain-service cho purchasing requests.
 */
@Injectable({ providedIn: 'root' })
export class RequestService {
  private readonly apiUrl = `${inject(API_URL)}/requests`;

  constructor(private http: HttpClient) {}

  /** Lấy danh sách requests (có filter) */
  getAll(filters?: { status?: string; search?: string }): Observable<PurchasingRequest[]> {
    let params = new HttpParams();
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.search) params = params.set('search', filters.search);
    return this.http
      .get<ApiResponse<PurchasingRequest[]> | PurchasingRequest[]>(this.apiUrl, { params })
      .pipe(map((res) => ('data' in (res as any) ? (res as ApiResponse<PurchasingRequest[]>).data : (res as PurchasingRequest[]))));
  }

  /** Lấy chi tiết 1 request */
  getById(id: number): Observable<PurchasingRequest> {
    return this.http
      .get<ApiResponse<PurchasingRequest> | PurchasingRequest>(`${this.apiUrl}/${id}`)
      .pipe(map((res) => ('data' in (res as any) ? (res as ApiResponse<PurchasingRequest>).data : (res as PurchasingRequest))));
  }

  /** Tạo request mới */
  create(dto: CreateRequestDto): Observable<PurchasingRequest> {
    return this.http
      .post<ApiResponse<PurchasingRequest> | PurchasingRequest>(this.apiUrl, dto)
      .pipe(map((res) => ('data' in (res as any) ? (res as ApiResponse<PurchasingRequest>).data : (res as PurchasingRequest))));
  }

  /** Submit request để phê duyệt */
  submit(id: number): Observable<PurchasingRequest> {
    return this.http
      .post<ApiResponse<PurchasingRequest> | PurchasingRequest>(`${this.apiUrl}/${id}/submit`, {})
      .pipe(map((res) => ('data' in (res as any) ? (res as ApiResponse<PurchasingRequest>).data : (res as PurchasingRequest))));
  }
}
