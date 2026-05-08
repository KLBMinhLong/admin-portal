import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '@core/models/auth.models';

export interface ProfileDto {
  username: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  twoFactorEnabled: boolean;
  createdAt: string;
}

export interface Toggle2faResponse {
  enabled: boolean;
  qrCodeImage: string;
}

export interface ChangePasswordDto {
  oldPassword?: string;
  newPassword?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = `${environment.apiBaseUrl}/profile`;

  constructor(private http: HttpClient) {}

  getProfile(): Observable<ProfileDto> {
    return this.http.get<ApiResponse<ProfileDto>>(this.apiUrl).pipe(
      map(res => res.data)
    );
  }

  changePassword(data: any): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/change-password`, data);
  }

  toggle2fa(): Observable<Toggle2faResponse> {
    return this.http.post<Toggle2faResponse>(`${this.apiUrl}/2fa/toggle`, {});
  }
}
