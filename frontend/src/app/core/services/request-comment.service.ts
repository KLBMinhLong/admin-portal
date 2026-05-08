import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_URL } from '@core/tokens/config.token';
import { inject } from '@angular/core';
import { ApiResponse } from '../models/auth.models';
export interface CommentDto {
  id?: number;
  authorName?: string;
  authorRole?: string;
  content: string;
  isSystem?: boolean;
  timestamp?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RequestCommentService {
  private baseUrl = inject(API_URL);
  private apiUrl = `${this.baseUrl}/requests`;

  constructor(private http: HttpClient) {}

  getComments(requestId: number): Observable<CommentDto[]> {
    return this.http
      .get<ApiResponse<CommentDto[]> | CommentDto[]>(`${this.apiUrl}/${requestId}/comments`)
      .pipe(map((res) => ('data' in (res as any) ? (res as ApiResponse<CommentDto[]>).data : (res as CommentDto[]))));
  }

  addComment(requestId: number, content: string): Observable<CommentDto> {
    return this.http
      .post<ApiResponse<CommentDto> | CommentDto>(`${this.apiUrl}/${requestId}/comments`, { content })
      .pipe(map((res) => ('data' in (res as any) ? (res as ApiResponse<CommentDto>).data : (res as CommentDto))));
  }
}
