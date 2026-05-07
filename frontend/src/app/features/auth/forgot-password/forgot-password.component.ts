import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { FormFieldComponent } from '@shared/components/form-field/form-field.component';
import { InputComponent } from '@shared/components/input/input.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { AlertComponent } from '@shared/components/alert/alert.component';

/**
 * Forgot Password page — Smart Component.
 */
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    FormFieldComponent, InputComponent, ButtonComponent, AlertComponent,
  ],
  template: `
    <h2 class="text-center text-xl font-semibold text-slate-900 mb-2">Quên mật khẩu</h2>
    <p class="text-sm text-slate-500 mb-6">
      Nhập email đã đăng ký. Chúng tôi sẽ gửi link đặt lại mật khẩu.
    </p>

    @if (successMsg()) {
      <app-alert variant="success" class="mb-4">{{ successMsg() }}</app-alert>
    }

    @if (errorMsg()) {
      <app-alert variant="error" class="mb-4" [dismissible]="true" (dismissed)="errorMsg.set('')">
        {{ errorMsg() }}
      </app-alert>
    }

    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
      <app-form-field
        label="Email"
        fieldId="forgot-email"
        [required]="true"
        [error]="form.get('email')?.touched && form.get('email')?.invalid ? 'Vui lòng nhập email hợp lệ' : ''"
      >
        <app-input
          formControlName="email"
          fieldId="forgot-email"
          type="email"
          placeholder="example@company.com"
          autocomplete="email"
          [hasError]="!!(form.get('email')?.touched && form.get('email')?.invalid)"
        />
      </app-form-field>

      <div class="flex justify-center">
      <app-button
        type="submit"
        [loading]="loading()"
        [disabled]="loading()"
        [fullWidth]="true"
      >
        {{ loading() ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu' }}
      </app-button>
      </div>
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
