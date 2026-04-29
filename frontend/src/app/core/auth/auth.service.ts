import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '@env/environment';
import {
  AuthState,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  TwoFactorVerifyRequest,
  SessionResponse,
} from '../models/auth.models';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

/**
 * AuthService — quản lý toàn bộ luồng auth.
 *
 * UC-FE-01 Task 2: AuthService + AuthStateStore
 *   - Signal-based reactive state (Angular 18)
 *   - Token lưu sessionStorage (không localStorage → single tab session)
 *   - Auto restore state khi refresh page
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiBaseUrl}/auth`;

  /* ─── Reactive State (Signals) ─── */
  private readonly _state = signal<AuthState>({
    token: null,
    user: null,
    isAuthenticated: false,
    authorities: [],
  });

  /** Read-only computed signals cho components */
  readonly isAuthenticated = computed(() => this._state().isAuthenticated);
  readonly currentUser = computed(() => this._state().user);
  readonly token = computed(() => this._state().token);
  readonly authorities = computed(() => this._state().authorities);

  /** Challenge key cho 2FA flow */
  private twoFactorChallenge: string | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    this.restoreSession();
  }

  /* ────────────────────────────────────────────
   *  LOGIN
   * ──────────────────────────────────────────── */
  login(req: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, req).pipe(
      tap((res) => {
        if (res.requiresTwoFactor) {
          this.twoFactorChallenge = res.challenge;
        } else if (res.token && res.user) {
          this.setSession(res.token, res.user);
        }
      }),
    );
  }

  /* ────────────────────────────────────────────
   *  2FA VERIFY
   * ──────────────────────────────────────────── */
  getChallenge(): string | null {
    return this.twoFactorChallenge;
  }

  verify2FA(otp: string): Observable<LoginResponse> {
    if (!this.twoFactorChallenge) {
      return throwError(() => new Error('No 2FA challenge'));
    }
    const req: TwoFactorVerifyRequest = {
      challenge: this.twoFactorChallenge,
      otp,
    };
    return this.http.post<LoginResponse>(`${this.apiUrl}/verify-2fa`, req).pipe(
      tap((res) => {
        if (res.token && res.user) {
          this.twoFactorChallenge = null;
          this.setSession(res.token, res.user);
        }
      }),
    );
  }

  /* ────────────────────────────────────────────
   *  REGISTER
   * ──────────────────────────────────────────── */
  register(req: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, req);
  }

  /* ────────────────────────────────────────────
   *  FORGOT / RESET PASSWORD
   * ──────────────────────────────────────────── */
  forgotPassword(email: string): Observable<void> {
    const req: ForgotPasswordRequest = { email };
    return this.http.post<void>(`${this.apiUrl}/forgot-password`, req);
  }

  resetPassword(token: string, newPassword: string): Observable<void> {
    const req: ResetPasswordRequest = { token, newPassword };
    return this.http.post<void>(`${this.apiUrl}/reset-password`, req);
  }

  /* ────────────────────────────────────────────
   *  LOGOUT
   * ──────────────────────────────────────────── */
  logout(): void {
    const currentToken = this._state().token;
    if (currentToken) {
      this.http
        .post(`${this.apiUrl}/logout`, null, {
          headers: { Authorization: `Bearer ${currentToken}` },
        })
        .pipe(catchError(() => [] as any))
        .subscribe();
    }
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  /* ────────────────────────────────────────────
   *  SESSION
   * ──────────────────────────────────────────── */
  getSession(): Observable<SessionResponse> {
    return this.http.get<SessionResponse>(`${this.apiUrl}/session`).pipe(
      tap((session) => {
        this._state.update((s) => ({
          ...s,
          authorities: session.authorities,
        }));
      }),
    );
  }

  /* ────────────────────────────────────────────
   *  PRIVATE HELPERS
   * ──────────────────────────────────────────── */
  private setSession(token: string, user: { id: string; username: string; role: string }): void {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    this._state.set({
      token,
      user,
      isAuthenticated: true,
      authorities: [],
    });
  }

  private clearSession(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    this.twoFactorChallenge = null;
    this._state.set({
      token: null,
      user: null,
      isAuthenticated: false,
      authorities: [],
    });
  }

  private restoreSession(): void {
    const token = sessionStorage.getItem(TOKEN_KEY);
    const userJson = sessionStorage.getItem(USER_KEY);
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson);
        this._state.set({
          token,
          user,
          isAuthenticated: true,
          authorities: [],
        });
      } catch {
        this.clearSession();
      }
    }
  }
}
