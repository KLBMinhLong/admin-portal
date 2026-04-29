import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <h2 class="text-xl font-semibold text-slate-900 mb-2">Đặt lại mật khẩu</h2>
    <p class="text-sm text-slate-500 mb-6">Nhập mật khẩu mới cho tài khoản của bạn.</p>

    @if (successMsg()) {
      <div class="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
        {{ successMsg() }}
      </div>
      <div class="text-center mt-4">
        <a routerLink="/auth/login"
          class="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors cursor-pointer">
          Đi đến trang đăng nhập
        </a>
      </div>
    } @else {
      @if (errorMsg()) {
        <div class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700" role="alert">
          {{ errorMsg() }}
        </div>
      }

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        <div>
          <label for="reset-password" class="block text-sm font-medium text-slate-700 mb-1">
            Mật khẩu mới <span class="text-red-500">*</span>
          </label>
          <input id="reset-password" type="password" formControlName="newPassword" autocomplete="new-password"
            class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm
                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none
                   transition-colors duration-200"
            placeholder="Tối thiểu 12 ký tự" />
          @if (form.get('newPassword')?.touched && form.get('newPassword')?.hasError('minlength')) {
            <p class="mt-1 text-xs text-red-600">Mật khẩu tối thiểu 12 ký tự</p>
          }
        </div>

        <div>
          <label for="reset-confirm" class="block text-sm font-medium text-slate-700 mb-1">
            Xác nhận mật khẩu <span class="text-red-500">*</span>
          </label>
          <input id="reset-confirm" type="password" formControlName="confirmPassword"
            class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm
                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none
                   transition-colors duration-200"
            placeholder="Nhập lại mật khẩu mới" />
          @if (form.get('confirmPassword')?.touched && passwordMismatch()) {
            <p class="mt-1 text-xs text-red-600">Mật khẩu không khớp</p>
          }
        </div>

        <button type="submit" [disabled]="loading()"
          class="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium
                 rounded-lg transition-colors duration-200 cursor-pointer
                 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                 disabled:bg-slate-300 disabled:cursor-not-allowed">
          @if (loading()) {
            Đang đặt lại...
          } @else {
            Đặt lại mật khẩu
          }
        </button>
      </form>
    }
  `,
})
export class ResetPasswordComponent implements OnInit {
  form: FormGroup;
  loading = signal(false);
  errorMsg = signal('');
  successMsg = signal('');
  private resetToken = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.form = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(12)]],
      confirmPassword: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.resetToken = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.resetToken) {
      this.errorMsg.set('Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
    }
  }

  passwordMismatch(): boolean {
    return this.form.get('newPassword')?.value !== this.form.get('confirmPassword')?.value;
  }

  onSubmit(): void {
    if (this.form.invalid || this.passwordMismatch()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMsg.set('');

    this.authService.resetPassword(this.resetToken, this.form.value.newPassword).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMsg.set('Đặt lại mật khẩu thành công!');
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMsg.set(err.error?.message || 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
      },
    });
  }
}
