import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ProfileService, ProfileDto } from './profile.service';
import { ToastService } from '@shared/components/toast/toast.service';
import { 
  PageHeaderComponent, CardComponent, BadgeComponent, IconComponent, 
  ButtonComponent, FormFieldComponent, InputComponent, AlertComponent 
} from '@shared/components';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    PageHeaderComponent, CardComponent, BadgeComponent, IconComponent,
    ButtonComponent, FormFieldComponent, InputComponent, AlertComponent
  ],
  template: `
    <div class="space-y-6">
      <app-page-header title="Hồ sơ cá nhân" />

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Thông tin cơ bản -->
        <div class="lg:col-span-1 space-y-6">
          <app-card>
            <div class="text-center border-b border-slate-100 bg-slate-50/50 -mx-6 -mt-6 p-6 rounded-t-2xl">
              <div class="w-24 h-24 rounded-full bg-blue-600 text-white text-3xl font-bold flex items-center justify-center mx-auto mb-4 shadow-md">
                {{ profile()?.username?.charAt(0)?.toUpperCase() || 'U' }}
              </div>
              <h2 class="text-lg font-semibold text-slate-900">{{ profile()?.firstName }} {{ profile()?.lastName }}</h2>
              <p class="text-sm text-slate-500 mb-2">{{ profile()?.username }}</p>
              <app-badge variant="info">{{ profile()?.role }}</app-badge>
            </div>
            <div class="pt-6 space-y-4">
              <div>
                <p class="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Email</p>
                <p class="text-sm font-medium text-slate-900">{{ profile()?.email }}</p>
              </div>
              <div>
                <p class="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Ngày tham gia</p>
                <p class="text-sm font-medium text-slate-900">{{ profile()?.createdAt | date:'longDate' }}</p>
              </div>
            </div>
          </app-card>
        </div>

        <!-- Cài đặt bảo mật -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Đổi mật khẩu -->
          <app-card>
            <h3 class="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <app-icon name="lock" class="text-slate-400" />
              Đổi mật khẩu
            </h3>
            
            <form [formGroup]="pwdForm" (ngSubmit)="changePassword()" class="space-y-4">
              @if (pwdError()) {
                <app-alert variant="error" [message]="pwdError()" />
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
                <app-button type="submit" variant="primary" [loading]="isSubmittingPwd()" [disabled]="pwdForm.invalid">
                  Cập nhật mật khẩu
                </app-button>
              </div>
            </form>
          </app-card>

          <!-- Xác thực 2 bước (2FA) -->
          <app-card>
            <h3 class="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <app-icon name="shield-check" class="text-slate-400" />
              Xác thực 2 bước (2FA)
            </h3>
            <p class="text-sm text-slate-500 mb-6">Bảo vệ tài khoản của bạn bằng cách thêm một lớp bảo mật phụ.</p>
            
            <div class="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <p class="text-sm font-medium text-slate-900">Trạng thái: 
                  <span [ngClass]="profile()?.twoFactorEnabled ? 'text-green-600' : 'text-slate-500'">
                    {{ profile()?.twoFactorEnabled ? 'Đã bật' : 'Đang tắt' }}
                  </span>
                </p>
                <p class="text-xs text-slate-500 mt-1">Sử dụng ứng dụng Google Authenticator để quét mã QR.</p>
              </div>
              <app-button 
                type="button" 
                (onClick)="toggle2FA()"
                [variant]="profile()?.twoFactorEnabled ? 'danger' : 'primary'"
                [icon]="profile()?.twoFactorEnabled ? 'x-circle' : 'shield-check'">
                {{ profile()?.twoFactorEnabled ? 'Tắt 2FA' : 'Bật 2FA' }}
              </app-button>
            </div>

            @if (qrCodeUrl()) {
              <div class="mt-6 p-6 border border-dashed border-slate-300 rounded-xl text-center">
                <p class="text-sm font-medium text-slate-900 mb-4">Quét mã QR dưới đây bằng Google Authenticator:</p>
                <img [src]="qrCodeUrl()" alt="QR Code" class="mx-auto w-48 h-48 border border-slate-100 rounded-lg shadow-sm" />
                <p class="text-xs text-slate-500 mt-4">Sau khi quét thành công, bạn sẽ cần nhập mã 6 số từ ứng dụng ở lần đăng nhập tiếp theo.</p>
              </div>
            }
          </app-card>
        </div>
      </div>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  profile = signal<ProfileDto | null>(null);
  
  pwdForm: FormGroup;
  pwdError = signal('');
  isSubmittingPwd = signal(false);

  qrCodeUrl = signal<string | null>(null);

  private fb = inject(FormBuilder);
  private profileService = inject(ProfileService);
  private toastService = inject(ToastService);

  constructor() {
    this.pwdForm = this.fb.group({
      oldPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.profileService.getProfile().subscribe(data => {
      this.profile.set(data);
    });
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

  changePassword() {
    if (this.pwdForm.invalid) {
      this.pwdForm.markAllAsTouched();
      return;
    }

    this.pwdError.set('');
    this.isSubmittingPwd.set(true);
    
    const { oldPassword, newPassword } = this.pwdForm.value;

    this.profileService.changePassword({ oldPassword, newPassword }).subscribe({
      next: () => {
        this.toastService.success('Thành công', 'Mật khẩu đã được đổi thành công!');
        this.pwdForm.reset();
        this.isSubmittingPwd.set(false);
      },
      error: () => {
        this.pwdError.set('Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ.');
        this.isSubmittingPwd.set(false);
      }
    });
  }

  toggle2FA() {
    this.profileService.toggle2fa().subscribe(res => {
      this.profile.update(p => p ? { ...p, twoFactorEnabled: res.enabled } : null);
      if (res.enabled && res.qrCodeImage) {
        this.qrCodeUrl.set(res.qrCodeImage);
        this.toastService.success('Thành công', 'Đã bật 2FA. Vui lòng quét mã QR bên dưới.');
      } else {
        this.qrCodeUrl.set(null);
        this.toastService.info('Thông báo', 'Đã tắt 2FA.');
      }
    });
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
