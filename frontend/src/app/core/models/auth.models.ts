/* ─── Auth Interfaces matching backend DTOs ─── */

export interface LoginRequest {
  username: string;
  password: string;
  totpCode?: string;
  deviceInfo?: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface TwoFactorVerifyRequest {
  challenge: string;
  otp: string;
}

/* ─── Response DTOs ─── */

export interface UserProfile {
  id: string;
  username: string;
  role: string;
}

export interface LoginResponse {
  token: string | null;
  user: UserProfile | null;
  requiresTwoFactor: boolean;
  challenge: string | null;
}

export interface RegisterResponse {
  id: string;
  username: string;
  email: string;
}

export interface SessionResponse {
  username: string;
  authorities: string[];
}

/* ─── Auth State ─── */

export interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  authorities: string[];
}

/* ─── Error ─── */

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
}
