import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { FormFieldComponent } from '@shared/components/form-field/form-field.component';
import { InputComponent } from '@shared/components/input/input.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { AlertComponent } from '@shared/components/alert/alert.component';

/**
 * Reset Password page — Smart Component.
 */
@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    FormFieldComponent, InputComponent, ButtonComponent, AlertComponent,
  ],
  template: `
    <h2 class="text-xl font-semibold text-slate-900 mb-2">Đặt lại mật khẩu</h2>
    <p class="text-sm text-slate-500 mb-6">Nhập mật khẩu mới cho tài khoản của bạn.</p>

    @if (successMsg()) {
      <app-alert variant="success" class="mb-4">{{ successMsg() }}</app-alert>
      <div class="text-center mt-4">
        <a routerLink="/auth/login"
          class="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors cursor-pointer">
          Đi đến trang đăng nhập
        </a>
      </div>
    } @else {
      @if (errorMsg()) {
        <app-alert variant="error" class="mb-4" [dismissible]="true" (dismissed)="errorMsg.set('')">
          {{ errorMsg() }}
        </app-alert>
      }

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        <app-form-field
          label="Mật khẩu mới"
          fieldId="reset-password"
          [required]="true"
          [error]="form.get('newPassword')?.touched && form.get('newPassword')?.hasError('minlength') ? 'Mật khẩu tối thiểu 12 ký tự' : ''"
        >
          <app-input
            formControlName="newPassword"
            fieldId="reset-password"
            type="password"
            placeholder="Tối thiểu 12 ký tự"
            autocomplete="new-password"
            [hasError]="!!(form.get('newPassword')?.touched && form.get('newPassword')?.invalid)"
          />
        </app-form-field>

        <app-form-field
          label="Xác nhận mật khẩu"
          fieldId="reset-confirm"
          [required]="true"
          [error]="form.get('confirmPassword')?.touched && passwordMismatch() ? 'Mật khẩu không khớp' : ''"
        >
          <app-input
            formControlName="confirmPassword"
            fieldId="reset-confirm"
            type="password"
            placeholder="Nhập lại mật khẩu mới"
            [hasError]="!!(form.get('confirmPassword')?.touched && passwordMismatch())"
          />
        </app-form-field>

        <app-button
          type="submit"
          [loading]="loading()"
          [disabled]="loading()"
          [fullWidth]="true"
        >
          {{ loading() ? 'Đang đặt lại...' : 'Đặt lại mật khẩu' }}
        </app-button>
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
