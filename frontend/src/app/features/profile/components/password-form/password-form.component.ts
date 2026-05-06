import { Component, EventEmitter, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { FormFieldComponent, InputComponent, ButtonComponent, AlertComponent } from '@shared/components';
import { ChangePasswordDto } from '../../profile.service';

@Component({
  selector: 'app-password-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    FormFieldComponent, InputComponent, ButtonComponent, AlertComponent
  ],
  template: `
    <form [formGroup]="pwdForm" (ngSubmit)="onSubmit()" class="space-y-4">
      @if (error()) {
        <app-alert variant="error">{{ error() }}</app-alert>
      }
      
      <app-form-field label="Mật khẩu hiện tại" fieldId="oldPassword" [required]="true" [error]="getFieldError('oldPassword')">
        <app-input formControlName="oldPassword" type="password" placeholder="Nhập mật khẩu hiện tại" [hasError]="hasFieldError('oldPassword')" />
      </app-form-field>
      
      <app-form-field label="Mật khẩu mới" fieldId="newPassword" [required]="true" [error]="getFieldError('newPassword')">
        <app-input formControlName="newPassword" type="password" placeholder="Nhập mật khẩu mới" [hasError]="hasFieldError('newPassword')" />
        <!-- Password Strength Meter -->
        <div class="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
          <div class="h-full transition-all duration-300" [ngClass]="getStrengthColor()" [style.width]="getStrengthPercentage()"></div>
        </div>
        <p class="text-[10px] text-slate-500 mt-1">Độ mạnh: {{ getStrengthText() }}</p>
      </app-form-field>

      <app-form-field label="Xác nhận mật khẩu mới" fieldId="confirmPassword" [required]="true" [error]="getFieldError('confirmPassword') || (pwdForm.hasError('passwordMismatch') && pwdForm.get('confirmPassword')?.touched ? 'Mật khẩu xác nhận không khớp.' : '')">
        <app-input formControlName="confirmPassword" type="password" placeholder="Nhập lại mật khẩu mới" [hasError]="hasFieldError('confirmPassword') || !!(pwdForm.hasError('passwordMismatch') && pwdForm.get('confirmPassword')?.touched)" />
      </app-form-field>

      <div class="flex justify-end pt-2">
        <app-button type="submit" variant="primary" [loading]="isSubmitting()" [disabled]="pwdForm.invalid">
          Cập nhật mật khẩu
        </app-button>
      </div>
    </form>
  `
})
export class PasswordFormComponent {
  submitted = output<ChangePasswordDto>();
  
  pwdForm: FormGroup;
  error = signal('');
  isSubmitting = signal(false);

  constructor(private fb: FormBuilder) {
    this.pwdForm = this.fb.group({
      oldPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(g: AbstractControl): ValidationErrors | null {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { passwordMismatch: true };
  }

  hasFieldError(field: string): boolean {
    const control = this.pwdForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getFieldError(field: string): string {
    const control = this.pwdForm.get(field);
    if (!control || !control.errors || (!control.dirty && !control.touched)) return '';
    
    if (control.errors['required']) return 'Trường này là bắt buộc';
    if (control.errors['minlength']) return 'Mật khẩu phải có ít nhất 8 ký tự';
    return 'Dữ liệu không hợp lệ';
  }

  onSubmit(): void {
    if (this.pwdForm.invalid) {
      this.pwdForm.markAllAsTouched();
      return;
    }
    const { oldPassword, newPassword } = this.pwdForm.value;
    this.submitted.emit({ oldPassword, newPassword });
  }

  // Helpers
  setSubmitting(value: boolean): void {
    this.isSubmitting.set(value);
  }

  setError(msg: string): void {
    this.error.set(msg);
  }

  resetForm(): void {
    this.pwdForm.reset();
    this.error.set('');
  }

  // Helper cho Password Strength
  getStrengthPercentage(): string {
    const len = this.pwdForm.get('newPassword')?.value?.length || 0;
    if (len === 0) return '0%';
    if (len < 6) return '33%';
    if (len < 10) return '66%';
    return '100%';
  }

  getStrengthColor(): string {
    const len = this.pwdForm.get('newPassword')?.value?.length || 0;
    if (len === 0) return 'bg-transparent';
    if (len < 6) return 'bg-red-500';
    if (len < 10) return 'bg-yellow-500';
    return 'bg-green-500';
  }

  getStrengthText(): string {
    const len = this.pwdForm.get('newPassword')?.value?.length || 0;
    if (len === 0) return 'Chưa nhập';
    if (len < 6) return 'Yếu';
    if (len < 10) return 'Trung bình';
    return 'Mạnh';
  }
}
