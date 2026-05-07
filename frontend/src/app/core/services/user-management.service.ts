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

@Injectable({ providedIn: 'root' })
export class UserManagementService {
  private readonly apiUrl = `${inject(API_URL)}/admin/users`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(this.apiUrl).pipe(
      map(users => users.map(u => ({ ...u, roles: u.roles || [] })))
    );
  }

  getById(id: string): Observable<AdminUser> {
    return this.http.get<AdminUser>(`${this.apiUrl}/${id}`).pipe(
      map(u => ({ ...u, roles: u.roles || [] }))
    );
  }

  getRoleOptions(): Observable<AdminUserRoleOption[]> {
    return this.http.get<AdminUserRoleOption[]>(`${this.apiUrl}/role-options`);
  }

  createUser(payload: CreateAdminUserRequest): Observable<AdminUser> {
    return this.http.post<AdminUser>(this.apiUrl, payload).pipe(
      map(u => ({ ...u, roles: u.roles || [] }))
    );
  }

  updateUser(id: string, payload: UpdateAdminUserRequest): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.apiUrl}/${id}`, payload);
  }

  toggleActive(id: string): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.apiUrl}/${id}/toggle-active`, {});
  }

  updateRole(id: string, roleCode: string): Observable<AdminUser> {
    const body: UpdateAdminUserRoleRequest = { roleCode };
    return this.http.patch<AdminUser>(`${this.apiUrl}/${id}/role`, body);
  }

  assignRoles(id: string, roleCodes: string[]): Observable<{ assignedRoles: string[] }> {
    return this.http.post<{ assignedRoles: string[] }>(`${this.apiUrl}/${id}/roles`, { roleCodes });
  }
}
