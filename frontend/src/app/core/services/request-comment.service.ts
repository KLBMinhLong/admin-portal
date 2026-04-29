import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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
  private apiUrl = `${environment.apiUrl}/requests`;

  constructor(private http: HttpClient) {}

  getComments(requestId: number): Observable<CommentDto[]> {
    return this.http.get<CommentDto[]>(`${this.apiUrl}/${requestId}/comments`);
  }

  addComment(requestId: number, content: string): Observable<CommentDto> {
    return this.http.post<CommentDto>(`${this.apiUrl}/${requestId}/comments`, { content });
  }
}
