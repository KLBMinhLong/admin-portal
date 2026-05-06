import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { FormFieldComponent } from '@shared/components/form-field/form-field.component';
import { InputComponent } from '@shared/components/input/input.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { AlertComponent } from '@shared/components/alert/alert.component';
import { IconComponent } from '@shared/components/icon/icon.component';

/** Custom validator khớp chính xác với password policy của backend */
function passwordPolicyValidator(control: AbstractControl): ValidationErrors | null {
  const val: string = control.value ?? '';
  const errors: Record<string, boolean> = {};
  if (val.length < 12)             errors['minlength']   = true;
  if (!/[A-Z]/.test(val))          errors['noUppercase'] = true;
  if (!/[a-z]/.test(val))          errors['noLowercase'] = true;
  if (!/\d/.test(val))             errors['noDigit']     = true;
  if (/^[a-zA-Z0-9]*$/.test(val)) errors['noSpecial']   = true;
  return Object.keys(errors).length ? errors : null;
}

/** Cross-field validator: confirmPassword phải khớp password */
function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  if (!confirmPassword) return null;
  return password === confirmPassword ? null : { passwordMismatch: true };
}

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
    CommonModule, ReactiveFormsModule, RouterLink,
    FormFieldComponent, InputComponent, ButtonComponent, AlertComponent, IconComponent,
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

    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
      <!-- Họ & Tên -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <app-form-field label="Họ" fieldId="reg-firstName">
          <app-input formControlName="firstName" fieldId="reg-firstName" placeholder="Nguyễn" />
        </app-form-field>

        <app-form-field label="Tên" fieldId="reg-lastName">
          <app-input formControlName="lastName" fieldId="reg-lastName" placeholder="Văn A" />
        </app-form-field>
      </div>

      <!-- Username -->
      <app-form-field
        label="Tên đăng nhập"
        fieldId="reg-username"
        [required]="true"
        [error]="getUsernameError()"
      >
        <app-input
          formControlName="username"
          fieldId="reg-username"
          placeholder="username_123"
          autocomplete="username"
          [hasError]="hasFieldError('username')"
        />
      </app-form-field>

      <!-- Email -->
      <app-form-field
        label="Email"
        fieldId="reg-email"
        [required]="true"
        [error]="getEmailError()"
      >
        <app-input
          formControlName="email"
          fieldId="reg-email"
          type="email"
          placeholder="example@company.com"
          autocomplete="email"
          [hasError]="hasFieldError('email')"
        />
      </app-form-field>

      <!-- Mật khẩu -->
      <app-form-field
        label="Mật khẩu"
        fieldId="reg-password"
        [required]="true"
      >
        <app-input
          formControlName="password"
          fieldId="reg-password"
          type="password"
          placeholder="Tối thiểu 12 ký tự"
          autocomplete="new-password"
          [hasError]="hasFieldError('password')"
        />

        <!-- Password policy checklist -->
        @if (pwdCtrl?.value || pwdCtrl?.touched) {
          <ul class="mt-2 space-y-0.5 text-xs">
            @for (rule of passwordRules; track rule.key) {
              <li class="flex items-center gap-1.5"
                  [class.text-green-600]="policyOk(rule.key)"
                  [class.text-red-500]="!policyOk(rule.key)">
                <app-icon
                  [name]="policyOk(rule.key) ? 'check-circle' : 'x-circle'"
                  size="xs"
                />
                {{ rule.label }}
              </li>
            }
          </ul>
        } @else {
          <p class="mt-1 text-xs text-slate-500">
            Tối thiểu 12 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt
          </p>
        }
      </app-form-field>

      <!-- Nhập lại mật khẩu -->
      <app-form-field
        label="Nhập lại mật khẩu"
        fieldId="reg-confirm-password"
        [required]="true"
        [error]="getConfirmPasswordError()"
      >
        <app-input
          formControlName="confirmPassword"
          fieldId="reg-confirm-password"
          type="password"
          placeholder="Nhập lại mật khẩu"
          autocomplete="new-password"
          [hasError]="hasConfirmPasswordError()"
        />
      </app-form-field>

      <!-- Submit -->
      <app-button
        type="submit"
        [loading]="loading()"
        [disabled]="loading()"
        [fullWidth]="true"
      >
        {{ loading() ? 'Đang đăng ký...' : 'Đăng ký' }}
      </app-button>
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

  /** Password policy rules configuration */
  readonly passwordRules = [
    { key: 'minlength',   label: 'Ít nhất 12 ký tự' },
    { key: 'noUppercase', label: 'Có chữ hoa (A-Z)' },
    { key: 'noLowercase', label: 'Có chữ thường (a-z)' },
    { key: 'noDigit',     label: 'Có chữ số (0-9)' },
    { key: 'noSpecial',   label: 'Có ký tự đặc biệt' },
  ];

  get pwdCtrl() { return this.form.get('password'); }

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
      password: ['', [Validators.required, passwordPolicyValidator]],
      confirmPassword: ['', [Validators.required]],
    }, { validators: passwordMatchValidator });
  }

  /** Returns true if the password field does NOT have the given validation error */
  policyOk(errorKey: string): boolean {
    const ctrl = this.form.get('password');
    if (!ctrl?.value) return false;
    return !ctrl.hasError(errorKey);
  }

  /** Kiểm tra field có lỗi không */
  hasFieldError(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.touched && ctrl.invalid);
  }

  /** Lấy error message cho username */
  getUsernameError(): string {
    const ctrl = this.form.get('username');
    if (!ctrl?.touched || ctrl.valid) return '';
    if (ctrl.hasError('required')) return 'Vui lòng nhập tên đăng nhập';
    return '3-50 ký tự, chỉ gồm chữ, số, dấu gạch dưới';
  }

  /** Lấy error message cho email */
  getEmailError(): string {
    const ctrl = this.form.get('email');
    if (!ctrl?.touched || ctrl.valid) return '';
    if (ctrl.hasError('required')) return 'Vui lòng nhập email';
    if (ctrl.hasError('email')) return 'Email không hợp lệ';
    return '';
  }

  /** Lấy error message cho confirm password */
  getConfirmPasswordError(): string {
    const ctrl = this.form.get('confirmPassword');
    if (!ctrl?.touched) return '';
    if (ctrl.hasError('required')) return 'Vui lòng nhập lại mật khẩu';
    if (this.form.hasError('passwordMismatch')) return 'Mật khẩu không khớp';
    return '';
  }

  /** Kiểm tra confirm password có lỗi không */
  hasConfirmPasswordError(): boolean {
    const ctrl = this.form.get('confirmPassword');
    if (!ctrl?.touched) return false;
    return ctrl.invalid || this.form.hasError('passwordMismatch');
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMsg.set('');
    this.successMsg.set('');

    // Chỉ gửi các field cần thiết (không gửi confirmPassword)
    const { confirmPassword, ...payload } = this.form.value;

    this.authService.register(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMsg.set('Đăng ký thành công! Đang chuyển hướng đến trang đăng nhập...');
        setTimeout(() => this.router.navigate(['/auth/login']), 2000);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const msg = err.error?.message || 'Đã xảy ra lỗi, vui lòng thử lại';
        this.errorMsg.set(msg);
      },
    });
  }
}
