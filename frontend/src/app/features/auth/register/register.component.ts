import { Component, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { AlertComponent } from '@shared/components/alert/alert.component';
import { RegisterFormComponent } from './components/register-form/register-form.component';

/**
 * Register page — Smart Component.
 * Chỉ chứa logic nghiệp vụ (gọi AuthService, validation, điều hướng).
 * UI delegate cho shared Dumb Components.
 *
 * Cải tiến: Thêm trường "Nhập lại mật khẩu" với cross-field validation.
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule, RouterLink, AlertComponent, RegisterFormComponent
  ],
  template: `
    <h2 class="text-xl font-semibold text-slate-900 mb-6">Đăng ký tài khoản</h2>

    @if (successMsg()) {
      <app-alert variant="success" class="mb-4">
        {{ successMsg() }}
      </app-alert>
    }

    @if (errorMsg()) {
      <app-alert variant="error" class="mb-4" [dismissible]="true" (dismissed)="errorMsg.set('')">
        {{ errorMsg() }}
      </app-alert>
    }

    <app-register-form (submitted)="onSubmit($event)" #registerFormComponent />

    <div class="mt-6 text-center text-sm text-slate-500">
      Đã có tài khoản?
      <a routerLink="/auth/login" class="text-blue-600 hover:text-blue-700 font-medium transition-colors cursor-pointer">
        Đăng nhập
      </a>
    </div>
  `,
})
export class RegisterComponent {
  loading = signal(false);
  errorMsg = signal('');
  successMsg = signal('');

  @ViewChild('registerFormComponent') registerFormComponent!: RegisterFormComponent;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  onSubmit(payload: any): void {
    this.loading.set(true);
    this.errorMsg.set('');
    this.successMsg.set('');
    if (this.registerFormComponent) this.registerFormComponent.setSubmitting(true);

    this.authService.register(payload).subscribe({
      next: () => {
        this.loading.set(false);
        if (this.registerFormComponent) this.registerFormComponent.setSubmitting(false);
        this.successMsg.set('Đăng ký thành công! Đang chuyển hướng đến trang đăng nhập...');
        setTimeout(() => this.router.navigate(['/auth/login']), 2000);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        if (this.registerFormComponent) this.registerFormComponent.setSubmitting(false);
        const msg = err.error?.message || 'Đã xảy ra lỗi, vui lòng thử lại';
        this.errorMsg.set(msg);
      },
    });
  }
}
