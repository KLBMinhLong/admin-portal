import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <h2 class="text-xl font-semibold text-slate-900 mb-2">Quên mật khẩu</h2>
    <p class="text-sm text-slate-500 mb-6">
      Nhập email đã đăng ký. Chúng tôi sẽ gửi link đặt lại mật khẩu.
    </p>

    @if (successMsg()) {
      <div class="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
        {{ successMsg() }}
      </div>
    }

    @if (errorMsg()) {
      <div class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700" role="alert">
        {{ errorMsg() }}
      </div>
    }

    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
      <div>
        <label for="forgot-email" class="block text-sm font-medium text-slate-700 mb-1">Email</label>
        <input id="forgot-email" type="email" formControlName="email" autocomplete="email"
          class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm
                 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none
                 transition-colors duration-200"
          placeholder="example@company.com" />
        @if (form.get('email')?.touched && form.get('email')?.invalid) {
          <p class="mt-1 text-xs text-red-600">Vui lòng nhập email hợp lệ</p>
        }
      </div>

      <button type="submit" [disabled]="loading()"
        class="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium
               rounded-lg transition-colors duration-200 cursor-pointer
               focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
               disabled:bg-slate-300 disabled:cursor-not-allowed">
        @if (loading()) {
          Đang gửi...
        } @else {
          Gửi link đặt lại mật khẩu
        }
      </button>
    </form>

    <div class="mt-6 text-center text-sm">
      <a routerLink="/auth/login" class="text-blue-600 hover:text-blue-700 transition-colors cursor-pointer">
        ← Quay lại đăng nhập
      </a>
    </div>
  `,
})
export class ForgotPasswordComponent {
  form: FormGroup;
  loading = signal(false);
  errorMsg = signal('');
  successMsg = signal('');

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMsg.set('');
    this.successMsg.set('');

    this.authService.forgotPassword(this.form.value.email).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMsg.set('Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.');
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        // Không tiết lộ email có tồn tại hay không (security)
        this.successMsg.set('Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu.');
      },
    });
  }
}
