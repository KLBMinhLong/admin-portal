import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService, ProfileDto } from './profile.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-4xl mx-auto space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Hồ sơ cá nhân</h1>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Thông tin cơ bản -->
        <div class="lg:col-span-1 space-y-6">
          <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div class="p-6 text-center border-b border-slate-100 bg-slate-50/50">
              <div class="w-24 h-24 rounded-full bg-blue-600 text-white text-3xl font-bold flex items-center justify-center mx-auto mb-4 shadow-md">
                {{ profile()?.username?.charAt(0)?.toUpperCase() || 'U' }}
              </div>
              <h2 class="text-lg font-semibold text-slate-900">{{ profile()?.firstName }} {{ profile()?.lastName }}</h2>
              <p class="text-sm text-slate-500">{{ profile()?.username }}</p>
              <span class="mt-2 inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                {{ profile()?.role }}
              </span>
            </div>
            <div class="p-6 space-y-4">
              <div>
                <p class="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Email</p>
                <p class="text-sm font-medium text-slate-900">{{ profile()?.email }}</p>
              </div>
              <div>
                <p class="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Ngày tham gia</p>
                <p class="text-sm font-medium text-slate-900">{{ profile()?.createdAt | date:'longDate' }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Cài đặt bảo mật -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Đổi mật khẩu -->
          <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 class="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              Đổi mật khẩu
            </h3>
            
            <form (ngSubmit)="changePassword()" class="space-y-4">
              @if (pwdError()) {
                <div class="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  {{ pwdError() }}
                </div>
              }
              @if (pwdSuccess()) {
                <div class="p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-100 flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  Mật khẩu đã được đổi thành công!
                </div>
              }

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Mật khẩu hiện tại</label>
                <input type="password" [(ngModel)]="pwdForm.oldPassword" name="oldPassword" required
                       class="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Mật khẩu mới</label>
                <input type="password" [(ngModel)]="pwdForm.newPassword" name="newPassword" required
                       class="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow" />
                
                <!-- Password Strength Meter -->
                <div class="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  <div class="h-full transition-all duration-300" [ngClass]="getStrengthColor()" [style.width]="getStrengthPercentage()"></div>
                </div>
                <p class="text-[10px] text-slate-500 mt-1">Độ mạnh: {{ getStrengthText() }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Xác nhận mật khẩu mới</label>
                <input type="password" [(ngModel)]="pwdForm.confirmPassword" name="confirmPassword" required
                       class="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow" />
              </div>
              <div class="flex justify-end pt-2">
                <button type="submit" [disabled]="isSubmittingPwd()"
                        class="px-5 py-2 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 transition-all disabled:opacity-50">
                  Cập nhật mật khẩu
                </button>
              </div>
            </form>
          </div>

          <!-- Xác thực 2 bước (2FA) -->
          <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 class="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <svg class="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
              </svg>
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
              <button type="button" (click)="toggle2FA()"
                      class="px-4 py-2 text-sm font-medium rounded-xl transition-all"
                      [ngClass]="profile()?.twoFactorEnabled ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'">
                {{ profile()?.twoFactorEnabled ? 'Tắt 2FA' : 'Bật 2FA' }}
              </button>
            </div>

            @if (qrCodeUrl()) {
              <div class="mt-6 p-6 border border-dashed border-slate-300 rounded-xl text-center">
                <p class="text-sm font-medium text-slate-900 mb-4">Quét mã QR dưới đây bằng Google Authenticator:</p>
                <img [src]="qrCodeUrl()" alt="QR Code" class="mx-auto w-48 h-48 border border-slate-100 rounded-lg shadow-sm" />
                <p class="text-xs text-slate-500 mt-4">Sau khi quét thành công, bạn sẽ cần nhập mã 6 số từ ứng dụng ở lần đăng nhập tiếp theo.</p>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  profile = signal<ProfileDto | null>(null);
  
  pwdForm = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  pwdError = signal('');
  pwdSuccess = signal(false);
  isSubmittingPwd = signal(false);

  qrCodeUrl = signal<string | null>(null);

  constructor(private profileService: ProfileService) {}

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.profileService.getProfile().subscribe(data => {
      this.profile.set(data);
    });
  }

  changePassword() {
    this.pwdError.set('');
    this.pwdSuccess.set(false);

    if (this.pwdForm.newPassword !== this.pwdForm.confirmPassword) {
      this.pwdError.set('Mật khẩu xác nhận không khớp.');
      return;
    }

    if (this.pwdForm.newPassword.length < 8) {
      this.pwdError.set('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }

    this.isSubmittingPwd.set(true);
    this.profileService.changePassword({
      oldPassword: this.pwdForm.oldPassword,
      newPassword: this.pwdForm.newPassword
    }).subscribe({
      next: () => {
        this.pwdSuccess.set(true);
        this.pwdForm = { oldPassword: '', newPassword: '', confirmPassword: '' };
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
      } else {
        this.qrCodeUrl.set(null);
      }
    });
  }

  // Helper cho Password Strength
  getStrengthPercentage(): string {
    const len = this.pwdForm.newPassword.length;
    if (len === 0) return '0%';
    if (len < 6) return '33%';
    if (len < 10) return '66%';
    return '100%';
  }

  getStrengthColor(): string {
    const len = this.pwdForm.newPassword.length;
    if (len === 0) return 'bg-transparent';
    if (len < 6) return 'bg-red-500';
    if (len < 10) return 'bg-yellow-500';
    return 'bg-green-500';
  }

  getStrengthText(): string {
    const len = this.pwdForm.newPassword.length;
    if (len === 0) return 'Chưa nhập';
    if (len < 6) return 'Yếu';
    if (len < 10) return 'Trung bình';
    return 'Mạnh';
  }
}
