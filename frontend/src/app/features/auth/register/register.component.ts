import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <h2 class="text-xl font-semibold text-slate-900 mb-6">Đăng ký tài khoản</h2>

    @if (successMsg()) {
      <div class="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
        {{ successMsg() }}
      </div>
    }

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
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label for="reg-firstName" class="block text-sm font-medium text-slate-700 mb-1">Họ</label>
          <input id="reg-firstName" type="text" formControlName="firstName"
            class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm
                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none
                   transition-colors duration-200"
            placeholder="Nguyễn" />
        </div>
        <div>
          <label for="reg-lastName" class="block text-sm font-medium text-slate-700 mb-1">Tên</label>
          <input id="reg-lastName" type="text" formControlName="lastName"
            class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm
                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none
                   transition-colors duration-200"
            placeholder="Văn A" />
        </div>
      </div>

      <div>
        <label for="reg-username" class="block text-sm font-medium text-slate-700 mb-1">
          Tên đăng nhập <span class="text-red-500">*</span>
        </label>
        <input id="reg-username" type="text" formControlName="username" autocomplete="username"
          class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm
                 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none
                 transition-colors duration-200"
          placeholder="username_123" />
        @if (form.get('username')?.touched && form.get('username')?.invalid) {
          <p class="mt-1 text-xs text-red-600">3-50 ký tự, chỉ gồm chữ, số, dấu gạch dưới</p>
        }
      </div>

      <div>
        <label for="reg-email" class="block text-sm font-medium text-slate-700 mb-1">
          Email <span class="text-red-500">*</span>
        </label>
        <input id="reg-email" type="email" formControlName="email" autocomplete="email"
          class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm
                 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none
                 transition-colors duration-200"
          placeholder="example@company.com" />
        @if (form.get('email')?.touched && form.get('email')?.hasError('email')) {
          <p class="mt-1 text-xs text-red-600">Email không hợp lệ</p>
        }
      </div>

      <div>
        <label for="reg-password" class="block text-sm font-medium text-slate-700 mb-1">
          Mật khẩu <span class="text-red-500">*</span>
        </label>
        <input id="reg-password" type="password" formControlName="password" autocomplete="new-password"
          class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm
                 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none
                 transition-colors duration-200"
          placeholder="Tối thiểu 12 ký tự" />
        @if (form.get('password')?.touched && form.get('password')?.hasError('minlength')) {
          <p class="mt-1 text-xs text-red-600">Mật khẩu tối thiểu 12 ký tự</p>
        }
      </div>

      <button type="submit" [disabled]="loading()"
        class="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium
               rounded-lg transition-colors duration-200 cursor-pointer
               focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
               disabled:bg-slate-300 disabled:cursor-not-allowed">
        @if (loading()) {
          <span class="inline-flex items-center gap-2">
            <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            Đang đăng ký...
          </span>
        } @else {
          Đăng ký
        }
      </button>
    </form>

    <div class="mt-6 text-center text-sm text-slate-500">
      Đã có tài khoản?
      <a routerLink="/auth/login" class="text-blue-600 hover:text-blue-700 font-medium transition-colors cursor-pointer">
        Đăng nhập
      </a>
    </div>
  `,
})
export class RegisterComponent {
  form: FormGroup;
  loading = signal(false);
  errorMsg = signal('');
  successMsg = signal('');

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      firstName: [''],
      lastName: [''],
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z0-9_]+$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(12)]],
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

    this.authService.register(this.form.value).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMsg.set('Đăng ký thành công! Đang chuyển hướng đến trang đăng nhập...');
        setTimeout(() => this.router.navigate(['/auth/login']), 2000);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const msg = err.error?.message || 'Đã xảy ra lỗi';
        this.errorMsg.set(msg);
      },
    });
  }
}
