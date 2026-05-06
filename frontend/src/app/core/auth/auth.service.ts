import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { API_URL } from '../tokens/config.token';
import {
  AuthState,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  TwoFactorVerifyRequest,
  UserProfile,
} from '../models/auth.models';
import { LoggingService } from '../services/logging.service';
import { AuthSessionStorageService } from './auth-session-storage.service';

/**
 * AuthService — quản lý toàn bộ luồng auth.
 *
 * UC-FE-01 Task 2: AuthService + AuthStateStore
 *   - Signal-based reactive state (Angular 18)
 *   - Session lưu qua AuthSessionStorageService
 *   - Auto restore state khi refresh page
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${inject(API_URL)}/auth`;

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
    private loggingService: LoggingService,
    private readonly sessionStorage: AuthSessionStorageService,
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
          this.loggingService.info(`[Auth] User '${req.username}' requires 2FA verification`);
        } else if (res.token && res.user) {
          this.loggingService.info(`[Auth] User '${res.user.username}' logged in successfully`);
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
          this.loggingService.info(`[Auth] User '${res.user.username}' verified 2FA and logged in successfully`);
          this.setSession(res.token, res.user);
        }
      }),
    );
  }

  /* ────────────────────────────────────────────
   *  REGISTER
   * ──────────────────────────────────────────── */
  register(req: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, req).pipe(
      tap((res) => {
        this.loggingService.info(`[Auth] User '${req.username}' registered successfully`);
      })
    );
  }

  /* ────────────────────────────────────────────
   *  FORGOT / RESET PASSWORD
   * ──────────────────────────────────────────── */
  forgotPassword(email: string): Observable<void> {
    const req: ForgotPasswordRequest = { email };
    return this.http.post<void>(`${this.apiUrl}/forgot-password`, req).pipe(
      tap(() => {
        this.loggingService.info(`[Auth] Forgot password requested for email: ${email}`);
      })
    );
  }

  resetPassword(token: string, newPassword: string): Observable<void> {
    const req: ResetPasswordRequest = { token, newPassword };
    return this.http.post<void>(`${this.apiUrl}/reset-password`, req).pipe(
      tap(() => {
        this.loggingService.info(`[Auth] Password reset successfully via token`);
      })
    );
  }

  /* ────────────────────────────────────────────
   *  LOGOUT
   * ──────────────────────────────────────────── */
  logout(): void {
    const currentToken = this._state().token;
    const currentUser = this._state().user;
    if (currentToken) {
      this.loggingService.info(`[Auth] User '${currentUser?.username || 'unknown'}' logged out`);
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
  ensureSessionLoaded(): Observable<boolean> {
    return of(this._state().isAuthenticated);
  }

  hasAuthority(authority: string): boolean {
    return this._state().authorities.includes(authority);
  }

  hasAllAuthorities(authorities: string[]): boolean {
    return authorities.every((authority) => this.hasAuthority(authority));
  }

  isAdmin(): boolean {
    return this.hasAuthority('ROLE_ADMIN');
  }

  /* ────────────────────────────────────────────
   *  SESSION HELPERS
   * ──────────────────────────────────────────── */
  private setSession(token: string, user: UserProfile): void {
    this._state.set({
      token,
      user,
      isAuthenticated: true,
      authorities: user.authorities || [],
    });

    void this.sessionStorage.saveSession({ token, user }).catch((err) => {
      this.loggingService.error('[AuthService] Failed to persist session:', err);
    });
  }

  private clearSession(): void {
    this.twoFactorChallenge = null;
    this.sessionStorage.clearSession();
    this._state.set({
      token: null,
      user: null,
      isAuthenticated: false,
      authorities: [],
    });
  }

  private restoreSession(): void {
    void this.sessionStorage
      .loadSession()
      .then((session) => {
        if (!session) {
          return;
        }

        this._state.set({
          token: session.token,
          user: session.user,
          isAuthenticated: true,
          authorities: session.user.authorities || [],
        });
      })
      .catch(() => this.clearSession());
  }
}
