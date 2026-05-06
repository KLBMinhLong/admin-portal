import { Component, OnInit, signal, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileService, ProfileDto, ChangePasswordDto } from './profile.service';
import { ToastService } from '@shared/components/toast/toast.service';
import { 
  PageHeaderComponent, CardComponent, BadgeComponent, IconComponent, 
  ButtonComponent, FormFieldComponent, InputComponent, AlertComponent 
} from '@shared/components';
import { PasswordFormComponent } from './components/password-form/password-form.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent, CardComponent, BadgeComponent, IconComponent,
    ButtonComponent, PasswordFormComponent
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
            
            <app-password-form (submitted)="changePassword($event)" #pwdFormComponent />
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
  qrCodeUrl = signal<string | null>(null);

  @ViewChild('pwdFormComponent') pwdFormComponent!: PasswordFormComponent;

  private profileService = inject(ProfileService);
  private toastService = inject(ToastService);

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.profileService.getProfile().subscribe(data => {
      this.profile.set(data);
    });
  }

  changePassword(dto: ChangePasswordDto) {
    if (this.pwdFormComponent) {
      this.pwdFormComponent.setSubmitting(true);
      this.pwdFormComponent.setError('');
    }

    this.profileService.changePassword(dto).subscribe({
      next: () => {
        this.toastService.success('Mật khẩu đã được đổi thành công!');
        if (this.pwdFormComponent) {
          this.pwdFormComponent.resetForm();
          this.pwdFormComponent.setSubmitting(false);
        }
      },
      error: () => {
        if (this.pwdFormComponent) {
          this.pwdFormComponent.setError('Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ.');
          this.pwdFormComponent.setSubmitting(false);
        }
      }
    });
  }

  toggle2FA() {
    this.profileService.toggle2fa().subscribe(res => {
      this.profile.update(p => p ? { ...p, twoFactorEnabled: res.enabled } : null);
      if (res.enabled && res.qrCodeImage) {
        this.qrCodeUrl.set(res.qrCodeImage);
        this.toastService.success('Đã bật 2FA. Vui lòng quét mã QR bên dưới.');
      } else {
        this.qrCodeUrl.set(null);
        this.toastService.info('Đã tắt 2FA.');
      }
    });
  }
}
