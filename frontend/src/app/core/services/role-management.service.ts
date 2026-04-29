import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { AdminRole, AdminPermission, AdminAuditLog, AssignPermissionsRequest } from '../models/role.models';

@Injectable({ providedIn: 'root' })
export class RoleManagementService {
  private readonly apiUrl = `${environment.apiBaseUrl}/admin`;

  constructor(private http: HttpClient) {}

  getRoles(): Observable<AdminRole[]> {
    return this.http.get<AdminRole[]>(`${this.apiUrl}/roles`);
  }

  getPermissions(): Observable<AdminPermission[]> {
    return this.http.get<AdminPermission[]>(`${this.apiUrl}/permissions`);
  }

  getAuditLogs(): Observable<AdminAuditLog[]> {
    return this.http.get<AdminAuditLog[]>(`${this.apiUrl}/audit-logs`);
  }

  assignPermissions(roleId: string, permissionCodes: string[]): Observable<any> {
    const payload: AssignPermissionsRequest = { permissionCodes };
    return this.http.post(`${this.apiUrl}/roles/${roleId}/permissions`, payload);
  }

  createRole(role: Partial<AdminRole>): Observable<AdminRole> {
    return this.http.post<AdminRole>(`${this.apiUrl}/roles`, role);
  }

  updateRole(roleId: string, role: Partial<AdminRole>): Observable<AdminRole> {
    return this.http.patch<AdminRole>(`${this.apiUrl}/roles/${roleId}`, role);
  }

  toggleRoleActive(roleId: string): Observable<AdminRole> {
    return this.http.patch<AdminRole>(`${this.apiUrl}/roles/${roleId}/toggle-active`, {});
  }
}
