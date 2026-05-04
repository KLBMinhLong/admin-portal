import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, from, map, of, shareReplay, switchMap, tap, throwError } from 'rxjs';
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

const TOKEN_KEY = 'auth_token_enc';
const USER_KEY = 'auth_user_enc';

/**
 * AuthService — quản lý toàn bộ luồng auth.
 *
 * UC-FE-01 Task 2: AuthService + AuthStateStore
 *   - Signal-based reactive state (Angular 18)
 *   - Token mã hóa AES-GCM trước khi lưu vào localStorage
 *   - Auto restore state khi refresh page
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiBaseUrl}/auth`;

  /* ─── Encryption helpers ─── */
  private readonly ENC_KEY_HEX = this.deriveKeyHex();
  private cryptoKey: CryptoKey | null = null;
  private readonly IV_LENGTH = 12;

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
    const role = this._state().user?.role ?? '';
    return role.replace(/^ROLE_/, '').toUpperCase() === 'ADMIN';
  }

  /* ────────────────────────────────────────────
   *  PRIVATE HELPERS — Encrypted localStorage
   * ──────────────────────────────────────────── */
  private setSession(token: string, user: { id: string; username: string; role: string; authorities: string[] }): void {
    this._state.set({
      token,
      user,
      isAuthenticated: true,
      authorities: user.authorities || [],
    });

    // Encrypt và lưu vào localStorage
    this.encryptAndStore(TOKEN_KEY, token);
    this.encryptAndStore(USER_KEY, JSON.stringify(user));
  }

  private clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.twoFactorChallenge = null;
    this._state.set({
      token: null,
      user: null,
      isAuthenticated: false,
      authorities: [],
    });
  }

  private restoreSession(): void {
    this.decryptAndRestore().then(({ token, user }) => {
      if (token && user) {
        try {
          const parsedUser = JSON.parse(user);
          this._state.set({
            token,
            user: parsedUser,
            isAuthenticated: true,
            authorities: parsedUser.authorities || [],
          });
        } catch {
          this.clearSession();
        }
      }
    }).catch(() => {
      this.clearSession();
    });
  }

  /* ─── AES-GCM Encryption for localStorage ─── */

  /**
   * Derive a stable encryption key from the app's ENCRYPT_SECRET.
   * Trả về hex string của 32 bytes.
   */
  private deriveKeyHex(): string {
    const secret = environment.encryption?.secretKey ?? 'default_local_storage_key_32ch!';
    // Sử dụng 32 bytes đầu tiên
    const encoder = new TextEncoder();
    const bytes = encoder.encode(secret);
    // Chuyển sang hex
    return Array.from(bytes.slice(0, 32))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private async getCryptoKey(): Promise<CryptoKey> {
    if (this.cryptoKey) {
      return this.cryptoKey;
    }
    // Chuyển hex → Uint8Array
    const keyBytes = new Uint8Array(
      (this.ENC_KEY_HEX.match(/.{1,2}/g) || []).map((byte) => parseInt(byte, 16)),
    );
    this.cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt'],
    );
    return this.cryptoKey;
  }

  private async encryptAndStore(key: string, plaintext: string): Promise<void> {
    try {
      const cryptoKey = await this.getCryptoKey();
      const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
      const encoded = new TextEncoder().encode(plaintext);
      const cipherBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv, tagLength: 128 },
        cryptoKey,
        encoded,
      );
      // Lưu dạng: base64(iv) + '.' + base64(ciphertext)
      const ivB64 = this.bufferToBase64(iv.buffer);
      const dataB64 = this.bufferToBase64(cipherBuffer);
      localStorage.setItem(key, `${ivB64}.${dataB64}`);
    } catch (err) {
      console.error(`[AuthService] Failed to encrypt and store ${key}:`, err);
    }
  }

  private async decryptAndRestore(): Promise<{ token: string | null; user: string | null }> {
    const result: { token: string | null; user: string | null } = { token: null, user: null };

    const tokenEnc = localStorage.getItem(TOKEN_KEY);
    const userEnc = localStorage.getItem(USER_KEY);

    if (!tokenEnc || !userEnc) {
      return result;
    }

    try {
      const cryptoKey = await this.getCryptoKey();
      result.token = await this.decryptValue(cryptoKey, tokenEnc);
      result.user = await this.decryptValue(cryptoKey, userEnc);
    } catch (err) {
      console.error('[AuthService] Failed to decrypt stored session:', err);
      // Xóa dữ liệu hỏng
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }

    return result;
  }

  private async decryptValue(cryptoKey: CryptoKey, stored: string): Promise<string> {
    const [ivB64, dataB64] = stored.split('.');
    if (!ivB64 || !dataB64) throw new Error('Invalid encrypted format');

    const iv = this.base64ToBuffer(ivB64);
    const ciphertext = this.base64ToBuffer(dataB64);
    const plainBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv, tagLength: 128 },
      cryptoKey,
      ciphertext,
    );
    return new TextDecoder().decode(plainBuffer);
  }

  private bufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return btoa(binary);
  }

  private base64ToBuffer(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}
