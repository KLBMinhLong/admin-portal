import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

/** Custom validator khop chinh xac voi password policy cua backend */
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
          [class.border-red-400]="form.get('username')?.touched && form.get('username')?.invalid"
          placeholder="username_123" />
        @if (form.get('username')?.touched && form.get('username')?.hasError('required')) {
          <p class="mt-1 text-xs text-red-600">Vui lòng nhập tên đăng nhập</p>
        } @else if (form.get('username')?.touched && form.get('username')?.invalid) {
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
          [class.border-red-400]="form.get('email')?.touched && form.get('email')?.invalid"
          placeholder="example@company.com" />
        @if (form.get('email')?.touched && form.get('email')?.hasError('required')) {
          <p class="mt-1 text-xs text-red-600">Vui lòng nhập email</p>
        } @else if (form.get('email')?.touched && form.get('email')?.hasError('email')) {
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
          [class.border-red-400]="form.get('password')?.touched && form.get('password')?.invalid"
          placeholder="Tối thiểu 12 ký tự" />

        @if (pwdCtrl?.value || pwdCtrl?.touched) {
          <ul class="mt-2 space-y-0.5 text-xs">
            <li [class]="policyOk('minlength')   ? 'text-green-600' : 'text-red-500'">
              @if (policyOk('minlength'))   { [OK] } @else { [ ] }
              Ít nhất 12 ký tự
            </li>
            <li [class]="policyOk('noUppercase') ? 'text-green-600' : 'text-red-500'">
              @if (policyOk('noUppercase')) { [OK] } @else { [ ] }
              Có chữ hoa (A-Z)
            </li>
            <li [class]="policyOk('noLowercase') ? 'text-green-600' : 'text-red-500'">
              @if (policyOk('noLowercase')) { [OK] } @else { [ ] }
              Có chữ thường (a-z)
            </li>
            <li [class]="policyOk('noDigit')     ? 'text-green-600' : 'text-red-500'">
              @if (policyOk('noDigit'))     { [OK] } @else { [ ] }
              Có chữ số (0-9)
            </li>
            <li [class]="policyOk('noSpecial')   ? 'text-green-600' : 'text-red-500'">
              @if (policyOk('noSpecial'))   { [OK] } @else { [ ] }
              Có ký tự đặc biệt
            </li>
          </ul>
        } @else {
          <p class="mt-1 text-xs text-slate-500">Tối thiểu 12 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt</p>
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
    });
  }

  /** Returns true if the password field does NOT have the given validation error */
  policyOk(errorKey: string): boolean {
    const ctrl = this.form.get('password');
    if (!ctrl?.value) return false;
    return !ctrl.hasError(errorKey);
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
        const msg = err.error?.message || 'Đã xảy ra lỗi, vui lòng thử lại';
        this.errorMsg.set(msg);
      },
    });
  }
}
