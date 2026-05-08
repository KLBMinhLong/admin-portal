import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/auth.models';

export interface DashboardData {
  requestsByStatus: { [key: string]: number };
  monthlyCosts: { month: number; totalCost: number }[];
  topPendingRequests: {
    requestNumber: string;
    requestedBy: string;
    totalAmount: number;
    requestedDate: string;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${environment.apiBaseUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getDashboardData(): Observable<DashboardData> {
    return this.http
      .get<ApiResponse<DashboardData> | DashboardData>(this.apiUrl)
      .pipe(map((res) => ('data' in (res as any) ? (res as ApiResponse<DashboardData>).data : (res as DashboardData))));
  }
}
