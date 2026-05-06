import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { inject } from '@angular/core';
import { API_URL } from '../tokens/config.token';
import { CreateRequestDto, PurchasingRequest } from '../models/request.models';

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
    return this.http.get<PurchasingRequest[]>(this.apiUrl, { params });
  }

  /** Lấy chi tiết 1 request */
  getById(id: number): Observable<PurchasingRequest> {
    return this.http.get<PurchasingRequest>(`${this.apiUrl}/${id}`);
  }

  /** Tạo request mới */
  create(dto: CreateRequestDto): Observable<PurchasingRequest> {
    return this.http.post<PurchasingRequest>(this.apiUrl, dto);
  }

  /** Submit request để phê duyệt */
  submit(id: number): Observable<PurchasingRequest> {
    return this.http.post<PurchasingRequest>(`${this.apiUrl}/${id}/submit`, {});
  }
}
