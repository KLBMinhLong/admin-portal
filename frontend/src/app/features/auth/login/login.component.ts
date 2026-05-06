import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { FormFieldComponent } from '@shared/components/form-field/form-field.component';
import { InputComponent } from '@shared/components/input/input.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { AlertComponent } from '@shared/components/alert/alert.component';

/**
 * Login page — Smart Component.
 * Chỉ chứa logic nghiệp vụ (gọi AuthService, điều hướng).
 * UI delegate cho shared Dumb Components.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    FormFieldComponent, InputComponent, ButtonComponent, AlertComponent,
  ],
  template: `
    <h2 class="text-xl font-semibold text-slate-900 mb-6">Đăng nhập</h2>

    <!-- Error Alert -->
    @if (errorMsg()) {
      <app-alert variant="error" class="mb-4" [dismissible]="true" (dismissed)="errorMsg.set('')">
        {{ errorMsg() }}
      </app-alert>
    }

    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
      <!-- Username -->
      <app-form-field
        label="Tên đăng nhập"
        fieldId="login-username"
        [error]="getFieldError('username')"
      >
        <app-input
          formControlName="username"
          fieldId="login-username"
          placeholder="Nhập tên đăng nhập"
          autocomplete="username"
          [hasError]="hasFieldError('username')"
        />
      </app-form-field>

      <!-- Password -->
      <app-form-field
        label="Mật khẩu"
        fieldId="login-password"
        [error]="getFieldError('password')"
      >
        <app-input
          formControlName="password"
          fieldId="login-password"
          type="password"
          placeholder="Nhập mật khẩu"
          autocomplete="current-password"
          [hasError]="hasFieldError('password')"
        />
      </app-form-field>

      <!-- Submit -->
      <app-button
        type="submit"
        [loading]="loading()"
        [disabled]="loading()"
        [fullWidth]="true"
      >
        {{ loading() ? 'Đang đăng nhập...' : 'Đăng nhập' }}
      </app-button>
    </form>

    <!-- Links -->
    <div class="mt-6 space-y-3 text-center text-sm">
      <a
        routerLink="/auth/forgot-password"
        class="text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
      >
        Quên mật khẩu?
      </a>
      <p class="text-slate-500">
        Chưa có tài khoản?
        <a
          routerLink="/auth/register"
          class="text-blue-600 hover:text-blue-700 font-medium transition-colors cursor-pointer"
        >
          Đăng ký
        </a>
      </p>
    </div>
  `,
})
export class LoginComponent {
  form: FormGroup;
  loading = signal(false);
  errorMsg = signal('');

  /** Map lỗi backend → thông điệp tiếng Việt */
  private readonly ERROR_MAP: Record<string, string> = {
    'Bad credentials': 'Sai tên đăng nhập hoặc mật khẩu',
    'USER_INACTIVE': 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.',
    'USER_LOCKED': 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.',
    'TOO_MANY_REQUESTS': 'Quá nhiều lần thử. Vui lòng thử lại sau.',
  };

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  /** Lấy error message cho field (chỉ khi touched) */
  getFieldError(field: string): string {
    const ctrl = this.form.get(field);
    if (!ctrl?.touched || ctrl.valid) return '';
    if (ctrl.hasError('required')) return `Vui lòng nhập ${field === 'username' ? 'tên đăng nhập' : 'mật khẩu'}`;
    return '';
  }

  /** Kiểm tra field có lỗi không */
  hasFieldError(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.touched && ctrl.invalid);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMsg.set('');

    this.authService.login(this.form.value).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.requiresTwoFactor) {
          this.router.navigate(['/auth/verify-2fa']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const msg = err.error?.message || err.message || 'Đã xảy ra lỗi';
        this.errorMsg.set(this.ERROR_MAP[msg] || msg);
      },
    });
  }
}
