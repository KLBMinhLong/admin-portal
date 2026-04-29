import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { AdminUser, UpdateRoleRequest } from '../models/user.models';

/**
 * UC-FE-04: UserManagementService
 * Gọi API auth-service cho quản lý người dùng.
 */
@Injectable({ providedIn: 'root' })
export class UserManagementService {
  private readonly apiUrl = `${environment.apiBaseUrl}/admin/users`;

  constructor(private http: HttpClient) {}

  /** Lấy danh sách tất cả users */
  getAll(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(this.apiUrl);
  }

  /** Lấy chi tiết 1 user */
  getById(id: string): Observable<AdminUser> {
    return this.http.get<AdminUser>(`${this.apiUrl}/${id}`);
  }

  /** Toggle trạng thái active/inactive */
  toggleActive(id: string): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.apiUrl}/${id}/toggle-active`, {});
  }

  /** Cập nhật role */
  updateRole(id: string, role: string): Observable<AdminUser> {
    const body: UpdateRoleRequest = { role };
    return this.http.patch<AdminUser>(`${this.apiUrl}/${id}/role`, body);
  }
}
