import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { inject } from '@angular/core';
import { API_URL } from '../tokens/config.token';
import { AdminRole, AdminPermission, AdminAuditLog, AssignPermissionsRequest } from '../models/role.models';
import { ApiResponse } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class RoleManagementService {
  private readonly apiUrl = `${inject(API_URL)}/admin`;

  constructor(private http: HttpClient) {}

  getRoles(): Observable<AdminRole[]> {
    return this.http.get<ApiResponse<AdminRole[]>>(`${this.apiUrl}/roles`).pipe(map(res => res.data));
  }

  getPermissions(): Observable<AdminPermission[]> {
    return this.http.get<ApiResponse<AdminPermission[]>>(`${this.apiUrl}/permissions`).pipe(map(res => res.data));
  }

  getAuditLogs(): Observable<AdminAuditLog[]> {
    return this.http.get<ApiResponse<AdminAuditLog[]>>(`${this.apiUrl}/audit-logs`).pipe(map(res => res.data));
  }

  assignPermissions(roleId: string, permissionCodes: string[]): Observable<any> {
    const payload: AssignPermissionsRequest = { permissionCodes };
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/roles/${roleId}/permissions`, payload).pipe(map(res => res.data));
  }

  createRole(role: Partial<AdminRole>): Observable<AdminRole> {
    return this.http.post<ApiResponse<AdminRole>>(`${this.apiUrl}/roles`, role).pipe(map(res => res.data));
  }

  updateRole(roleId: string, role: Partial<AdminRole>): Observable<AdminRole> {
    return this.http.patch<ApiResponse<AdminRole>>(`${this.apiUrl}/roles/${roleId}`, role).pipe(map(res => res.data));
  }

  toggleRoleActive(roleId: string): Observable<AdminRole> {
    return this.http.patch<ApiResponse<AdminRole>>(`${this.apiUrl}/roles/${roleId}/toggle-active`, {}).pipe(map(res => res.data));
  }
}
