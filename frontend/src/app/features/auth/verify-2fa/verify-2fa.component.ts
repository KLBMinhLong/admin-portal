import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

/**
 * UC-FE-01: 2FA Verify page.
 * Edge Case: Refresh trang khi đang ở 2FA → giữ challenge state hợp lệ.
 *   → Challenge lưu trong AuthService (in-memory). Nếu refresh → mất → redirect login.
 */
@Component({
  selector: 'app-verify-2fa',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <h2 class="text-xl font-semibold text-slate-900 mb-2">Xác thực hai yếu tố</h2>
    <p class="text-sm text-slate-500 mb-6">
      Nhập mã OTP 6 số từ ứng dụng xác thực của bạn.
    </p>

    @if (errorMsg()) {
      <div class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700" role="alert">
        {{ errorMsg() }}
      </div>
    }

    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
      <div>
        <label for="otp-input" class="block text-sm font-medium text-slate-700 mb-1">Mã OTP</label>
        <input id="otp-input" type="text" formControlName="otp"
          maxlength="6"
          inputmode="numeric"
          pattern="[0-9]*"
          autocomplete="one-time-code"
          class="w-full px-3 py-3 border border-slate-300 rounded-lg text-center text-2xl font-semibold
                 tracking-[0.5em] text-slate-900
                 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none
                 transition-colors duration-200"
          placeholder="● ● ● ● ● ●" />
        @if (form.get('otp')?.touched && form.get('otp')?.invalid) {
          <p class="mt-1 text-xs text-red-600 text-center">Vui lòng nhập đúng 6 chữ số</p>
        }
      </div>

      <button type="submit" [disabled]="loading()"
        class="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium
               rounded-lg transition-colors duration-200 cursor-pointer
               focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
               disabled:bg-slate-300 disabled:cursor-not-allowed">
        @if (loading()) {
          Đang xác thực...
        } @else {
          Xác nhận
        }
      </button>
    </form>
  `,
})
export class Verify2faComponent {
  form: FormGroup;
  loading = signal(false);
  errorMsg = signal('');

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    // Edge Case: Nếu không có challenge (ví dụ refresh) → quay lại login
    if (!this.authService.getChallenge()) {
      this.router.navigate(['/auth/login']);
    }

    this.form = this.fb.group({
      otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMsg.set('');

    this.authService.verify2FA(this.form.value.otp).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMsg.set(err.error?.message || 'Mã OTP không chính xác. Vui lòng thử lại.');
      },
    });
  }
}
