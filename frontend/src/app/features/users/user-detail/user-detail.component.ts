import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UserManagementService } from '@core/services/user-management.service';
import { AdminUser, ROLE_OPTIONS } from '@core/models/user.models';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    @if (loading()) {
      <div class="space-y-4">
        <div class="skeleton h-8 w-64"></div>
        <div class="skeleton h-48 w-full"></div>
      </div>
    } @else if (user()) {
      <!-- Header -->
      <div class="flex items-center gap-4 mb-6">
        <a routerLink="/users"
          class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </a>
        <div class="flex-1">
          <h1 class="text-2xl font-bold text-slate-900">{{ user()!.username }}</h1>
          <p class="text-sm text-slate-500">{{ user()!.email }}</p>
        </div>
        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border"
          [class]="user()!.active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'">
          {{ user()!.active ? 'Hoạt động' : 'Đã khóa' }}
        </span>
      </div>

      @if (successMsg()) {
        <div class="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">{{ successMsg() }}</div>
      }
      @if (errorMsg()) {
        <div class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{{ errorMsg() }}</div>
      }

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Info cards -->
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 class="text-base font-semibold text-slate-900 mb-4">Thông tin tài khoản</h2>
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <dt class="text-slate-500">Username</dt>
                <dd class="text-slate-900 font-medium mt-0.5">{{ user()!.username }}</dd>
              </div>
              <div>
                <dt class="text-slate-500">Email</dt>
                <dd class="text-slate-900 font-medium mt-0.5">{{ user()!.email }}</dd>
              </div>
              <div>
                <dt class="text-slate-500">Họ</dt>
                <dd class="text-slate-900 mt-0.5">{{ user()!.lastName || '—' }}</dd>
              </div>
              <div>
                <dt class="text-slate-500">Tên</dt>
                <dd class="text-slate-900 mt-0.5">{{ user()!.firstName || '—' }}</dd>
              </div>
              <div>
                <dt class="text-slate-500">Email xác thực</dt>
                <dd class="mt-0.5">
                  @if (user()!.emailVerified) {
                    <span class="text-green-600 text-xs font-medium">✓ Đã xác thực</span>
                  } @else {
                    <span class="text-amber-600 text-xs font-medium">✗ Chưa xác thực</span>
                  }
                </dd>
              </div>
              <div>
                <dt class="text-slate-500">Bảo mật 2FA</dt>
                <dd class="mt-0.5">
                  @if (user()!.twoFactorEnabled) {
                    <span class="text-green-600 text-xs font-medium">✓ Đã bật</span>
                  } @else {
                    <span class="text-slate-400 text-xs">Chưa bật</span>
                  }
                </dd>
              </div>
              <div>
                <dt class="text-slate-500">Ngày tạo</dt>
                <dd class="text-slate-900 mt-0.5">{{ user()!.createdAt | date:'dd/MM/yyyy HH:mm' }}</dd>
              </div>
              <div>
                <dt class="text-slate-500">Cập nhật lần cuối</dt>
                <dd class="text-slate-900 mt-0.5">{{ user()!.updatedAt | date:'dd/MM/yyyy HH:mm' }}</dd>
              </div>
            </dl>
          </div>

          <!-- Roles assigned (from RBAC) -->
          @if (user()!.roles.length > 0) {
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 class="text-base font-semibold text-slate-900 mb-3">RBAC Roles được gán</h2>
              <div class="flex flex-wrap gap-2">
                @for (role of user()!.roles; track role) {
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    {{ role }}
                  </span>
                }
              </div>
            </div>
          }
        </div>

        <!-- Action panel -->
        <div class="space-y-6">
          <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 class="text-sm font-semibold text-slate-900 mb-4">Quản lý</h3>

            <!-- Role dropdown -->
            <div class="mb-4">
              <label class="block text-xs font-medium text-slate-600 mb-1">Role</label>
              <select [ngModel]="user()!.role" (ngModelChange)="onRoleChange($event)"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer">
                @for (r of roleOptions; track r.value) {
                  <option [value]="r.value">{{ r.label }}</option>
                }
              </select>
            </div>

            <!-- Toggle active -->
            <button (click)="toggleActive()" [disabled]="processing()"
              class="w-full py-2 px-4 text-sm font-medium rounded-lg transition-colors duration-200
                     cursor-pointer border disabled:opacity-50 disabled:cursor-not-allowed"
              [class]="user()!.active
                ? 'text-red-600 border-red-300 hover:bg-red-50'
                : 'text-green-600 border-green-300 hover:bg-green-50'">
              @if (processing()) {
                Đang xử lý...
              } @else if (user()!.active) {
                Khóa tài khoản
              } @else {
                Mở khóa tài khoản
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class UserDetailComponent implements OnInit {
  user = signal<AdminUser | null>(null);
  loading = signal(true);
  processing = signal(false);
  successMsg = signal('');
  errorMsg = signal('');
  roleOptions = ROLE_OPTIONS;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserManagementService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/users']); return; }

    this.userService.getById(id).subscribe({
      next: (data) => { this.user.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); this.router.navigate(['/users']); },
    });
  }

  toggleActive(): void {
    this.processing.set(true);
    this.errorMsg.set('');
    this.userService.toggleActive(this.user()!.id).subscribe({
      next: (updated) => {
        this.user.set(updated);
        this.processing.set(false);
        this.successMsg.set(updated.active ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.');
        setTimeout(() => this.successMsg.set(''), 3000);
      },
      error: (err: HttpErrorResponse) => {
        this.processing.set(false);
        this.errorMsg.set(err.error?.message || 'Lỗi khi thay đổi trạng thái.');
      },
    });
  }

  onRoleChange(newRole: string): void {
    this.processing.set(true);
    this.errorMsg.set('');
    this.userService.updateRole(this.user()!.id, newRole).subscribe({
      next: (updated) => {
        this.user.set(updated);
        this.processing.set(false);
        this.successMsg.set(`Đã cập nhật role thành "${newRole}".`);
        setTimeout(() => this.successMsg.set(''), 3000);
      },
      error: (err: HttpErrorResponse) => {
        this.processing.set(false);
        this.errorMsg.set(err.error?.message || 'Lỗi khi cập nhật role.');
      },
    });
  }
}
