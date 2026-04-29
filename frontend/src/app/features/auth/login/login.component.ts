import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <h2 class="text-xl font-semibold text-slate-900 mb-6">Đăng nhập</h2>

    <!-- Error Alert -->
    @if (errorMsg()) {
      <div
        class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2"
        role="alert"
      >
        <svg class="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <span>{{ errorMsg() }}</span>
      </div>
    }

    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
      <!-- Username -->
      <div>
        <label for="login-username" class="block text-sm font-medium text-slate-700 mb-1">
          Tên đăng nhập
        </label>
        <input
          id="login-username"
          type="text"
          formControlName="username"
          autocomplete="username"
          class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm
                 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none
                 transition-colors duration-200"
          placeholder="Nhập tên đăng nhập"
        />
        @if (form.get('username')?.touched && form.get('username')?.hasError('required')) {
          <p class="mt-1 text-xs text-red-600">Vui lòng nhập tên đăng nhập</p>
        }
      </div>

      <!-- Password -->
      <div>
        <label for="login-password" class="block text-sm font-medium text-slate-700 mb-1">
          Mật khẩu
        </label>
        <input
          id="login-password"
          type="password"
          formControlName="password"
          autocomplete="current-password"
          class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm
                 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none
                 transition-colors duration-200"
          placeholder="Nhập mật khẩu"
        />
        @if (form.get('password')?.touched && form.get('password')?.hasError('required')) {
          <p class="mt-1 text-xs text-red-600">Vui lòng nhập mật khẩu</p>
        }
      </div>

      <!-- Submit -->
      <button
        type="submit"
        [disabled]="loading()"
        class="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium
               rounded-lg transition-colors duration-200 cursor-pointer
               focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
               disabled:bg-slate-300 disabled:cursor-not-allowed"
      >
        @if (loading()) {
          <span class="inline-flex items-center gap-2">
            <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            Đang đăng nhập...
          </span>
        } @else {
          Đăng nhập
        }
      </button>
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
