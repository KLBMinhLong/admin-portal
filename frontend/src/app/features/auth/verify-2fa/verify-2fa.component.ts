import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { FormFieldComponent } from '@shared/components/form-field/form-field.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { AlertComponent } from '@shared/components/alert/alert.component';

/**
 * UC-FE-01: 2FA Verify page — Smart Component.
 * Edge Case: Refresh trang khi đang ở 2FA → giữ challenge state hợp lệ.
 *   → Challenge lưu trong AuthService (in-memory). Nếu refresh → mất → redirect login.
 */
@Component({
  selector: 'app-verify-2fa',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    FormFieldComponent, ButtonComponent, AlertComponent,
  ],
  template: `
    <h2 class="text-xl font-semibold text-slate-900 mb-2">Xác thực hai yếu tố</h2>
    <p class="text-sm text-slate-500 mb-6">
      Nhập mã OTP 6 số từ ứng dụng xác thực của bạn.
    </p>

    @if (errorMsg()) {
      <app-alert variant="error" class="mb-4" [dismissible]="true" (dismissed)="errorMsg.set('')">
        {{ errorMsg() }}
      </app-alert>
    }

    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
      <app-form-field
        label="Mã OTP"
        fieldId="otp-input"
        [error]="form.get('otp')?.touched && form.get('otp')?.invalid ? 'Vui lòng nhập đúng 6 chữ số' : ''"
      >
        <!-- OTP input giữ nguyên inline vì style đặc biệt (center, tracking, large font) -->
        <input id="otp-input" type="text" formControlName="otp"
          maxlength="6"
          inputmode="numeric"
          pattern="[0-9]*"
          autocomplete="one-time-code"
          class="w-full px-3 py-3 border rounded-lg text-center text-2xl font-semibold
                 tracking-[0.5em] text-slate-900
                 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none
                 transition-colors duration-200"
          [class.border-slate-300]="!(form.get('otp')?.touched && form.get('otp')?.invalid)"
          [class.border-red-400]="form.get('otp')?.touched && form.get('otp')?.invalid"
          placeholder="● ● ● ● ● ●" />
      </app-form-field>

      <app-button
        type="submit"
        [loading]="loading()"
        [disabled]="loading()"
        [fullWidth]="true"
      >
        {{ loading() ? 'Đang xác thực...' : 'Xác nhận' }}
      </app-button>
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
