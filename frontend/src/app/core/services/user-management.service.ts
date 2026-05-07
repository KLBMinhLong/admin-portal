import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { inject } from '@angular/core';
import { API_URL } from '../tokens/config.token';
import {
  AdminUser,
  AdminUserRoleOption,
  CreateAdminUserRequest,
  UpdateAdminUserRequest,
  UpdateAdminUserRoleRequest,
} from '../models/user.models';
import { ApiResponse } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class UserManagementService {
  private readonly apiUrl = `${inject(API_URL)}/admin/users`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<AdminUser[]> {
    return this.http.get<ApiResponse<AdminUser[]>>(this.apiUrl).pipe(
      map(res => res.data.map(u => ({ ...u, roles: u.roles || [] })))
    );
  }

  getById(id: string): Observable<AdminUser> {
    return this.http.get<ApiResponse<AdminUser>>(`${this.apiUrl}/${id}`).pipe(
      map(res => ({ ...res.data, roles: res.data.roles || [] }))
    );
  }

  getRoleOptions(): Observable<AdminUserRoleOption[]> {
    return this.http.get<ApiResponse<AdminUserRoleOption[]>>(`${this.apiUrl}/role-options`).pipe(
      map(res => res.data)
    );
  }

  createUser(payload: CreateAdminUserRequest): Observable<AdminUser> {
    return this.http.post<ApiResponse<AdminUser>>(this.apiUrl, payload).pipe(
      map(res => ({ ...res.data, roles: res.data.roles || [] }))
    );
  }

  updateUser(id: string, payload: UpdateAdminUserRequest): Observable<AdminUser> {
    return this.http.patch<ApiResponse<AdminUser>>(`${this.apiUrl}/${id}`, payload).pipe(map(res => res.data));
  }

  toggleActive(id: string): Observable<AdminUser> {
    return this.http.patch<ApiResponse<AdminUser>>(`${this.apiUrl}/${id}/toggle-active`, {}).pipe(map(res => res.data));
  }

  updateRole(id: string, roleCode: string): Observable<AdminUser> {
    const body: UpdateAdminUserRoleRequest = { roleCode };
    return this.http.patch<ApiResponse<AdminUser>>(`${this.apiUrl}/${id}/role`, body).pipe(map(res => res.data));
  }

  assignRoles(id: string, roleCodes: string[]): Observable<{ assignedRoles: string[] }> {
    return this.http.post<ApiResponse<{ assignedRoles: string[] }>>(`${this.apiUrl}/${id}/roles`, { roleCodes }).pipe(map(res => res.data));
  }
}
