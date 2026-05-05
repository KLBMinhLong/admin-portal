import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { UserManagementService } from '@core/services/user-management.service';
import {
  AdminUser,
  AdminUserRoleOption,
  UpdateAdminUserRequest,
  USER_STATUS_CONFIG,
  formatRoleCode,
} from '@core/models/user.models';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    @if (loading()) {
      <div class="space-y-4">
        <div class="skeleton h-8 w-56 rounded-xl"></div>
        <div class="skeleton h-72 w-full rounded-3xl"></div>
      </div>
    } @else if (user()) {
      <div class="space-y-6">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex items-start gap-4">
            <a
              routerLink="/users"
              class="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50"
            >
              ←
            </a>
            <div class="flex items-start gap-4">
              <div class="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-900 text-lg font-semibold text-white">
                {{ getUserInitials(user()!) }}
              </div>
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">User Detail</p>
                <h1 class="mt-2 text-3xl font-bold tracking-tight text-slate-900">{{ user()!.username }}</h1>
                <p class="mt-2 text-sm text-slate-500">{{ user()!.email }}</p>
                <div class="mt-3 flex flex-wrap gap-2">
                  <span class="inline-flex rounded-full border px-2.5 py-1 text-xs font-medium" [class]="getStatusConfig().class">
                    {{ getStatusConfig().label }}
                  </span>
                  <span class="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {{ user()!.roles.length > 0 ? getRoleName(user()!.roles[0]) : 'Chưa có role' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div class="flex flex-wrap gap-3">
            <button
              type="button"
              (click)="toggleActive()"
              [disabled]="processing()"
              class="rounded-xl border px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
              [class]="user()!.active
                ? 'border-red-200 text-red-700 hover:bg-red-50'
                : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'"
            >
              {{ processing() ? 'Đang xử lý...' : (user()!.active ? 'Khóa tài khoản' : 'Mở khóa tài khoản') }}
            </button>
          </div>
        </div>

        @if (successMsg()) {
          <div class="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {{ successMsg() }}
          </div>
        }

        @if (errorMsg()) {
          <div class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {{ errorMsg() }}
          </div>
        }

        <div class="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <div class="space-y-6">
            <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-lg font-bold text-slate-900">Thông tin hồ sơ</h2>
                  <p class="mt-1 text-sm text-slate-500">Cập nhật email và thông tin hiển thị của người dùng.</p>
                </div>
              </div>

              <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="mt-6 grid gap-4 md:grid-cols-2">
                <label class="block md:col-span-2">
                  <span class="mb-1.5 block text-sm font-medium text-slate-700">Email</span>
                  <input formControlName="email" type="email" class="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200" />
                </label>

                <label class="block">
                  <span class="mb-1.5 block text-sm font-medium text-slate-700">Tên</span>
                  <input formControlName="firstName" type="text" class="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200" />
                </label>

                <label class="block">
                  <span class="mb-1.5 block text-sm font-medium text-slate-700">Họ</span>
                  <input formControlName="lastName" type="text" class="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200" />
                </label>

                <div class="md:col-span-2 flex justify-end pt-2">
                  <button
                    type="submit"
                    [disabled]="profileForm.invalid || profileSubmitting()"
                    class="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {{ profileSubmitting() ? 'Đang lưu...' : 'Lưu thông tin' }}
                  </button>
                </div>
              </form>
            </div>

            <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 class="text-lg font-bold text-slate-900">Metadata tài khoản</h2>
              <div class="mt-6 grid gap-4 md:grid-cols-2">
                <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Họ và tên</p>
                  <p class="mt-2 text-sm font-medium text-slate-900">{{ getDisplayName(user()!) }}</p>
                </div>
                <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Username</p>
                  <p class="mt-2 text-sm font-medium text-slate-900">{{ user()!.username }}</p>
                </div>
                <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Ngày tạo</p>
                  <p class="mt-2 text-sm font-medium text-slate-900">{{ user()!.createdAt | date:'dd/MM/yyyy HH:mm' }}</p>
                </div>
                <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Cập nhật gần nhất</p>
                  <p class="mt-2 text-sm font-medium text-slate-900">{{ user()!.updatedAt | date:'dd/MM/yyyy HH:mm' }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-6">
            <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 class="text-lg font-bold text-slate-900">Role và truy cập</h2>
              <div class="mt-5 space-y-4">
                <div class="block">
                  <span class="mb-1.5 block text-sm font-medium text-slate-700">Chỉ định Roles</span>
                  <div class="space-y-3 rounded-xl border border-slate-300 bg-slate-50 p-4">
                    @for (role of roleOptions(); track role.id) {
                      <label class="flex items-center gap-3">
                        <input type="checkbox"
                               [checked]="user()!.roles.includes(role.code)"
                               (change)="toggleUserRole(role.code, $any($event.target).checked)"
                               [disabled]="processing() || (user()!.roles.length <= 1 && user()!.roles.includes(role.code))"
                               class="h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-400 disabled:opacity-50" />
                        <span class="text-sm font-medium text-slate-800" [class.opacity-50]="processing()">{{ role.name }}</span>
                      </label>
                    }
                  </div>
                </div>
              </div>
            </div>

            <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 class="text-lg font-bold text-slate-900">Bảo mật</h2>
              <div class="mt-5 space-y-3">
                <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Email</p>
                  <p class="mt-2 text-sm font-medium" [class]="user()!.emailVerified ? 'text-emerald-700' : 'text-amber-700'">
                    {{ user()!.emailVerified ? 'Đã xác thực' : 'Chưa xác thực' }}
                  </p>
                </div>
                <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Xác thực hai lớp</p>
                  <p class="mt-2 text-sm font-medium" [class]="user()!.twoFactorEnabled ? 'text-emerald-700' : 'text-slate-600'">
                    {{ user()!.twoFactorEnabled ? 'Đã bật 2FA' : 'Chưa bật 2FA' }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class UserDetailComponent implements OnInit {
  user = signal<AdminUser | null>(null);
  roleOptions = signal<AdminUserRoleOption[]>([]);
  loading = signal(true);
  processing = signal(false);
  profileSubmitting = signal(false);
  successMsg = signal('');
  errorMsg = signal('');

  profileForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    firstName: [''],
    lastName: [''],
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly userService: UserManagementService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/users']);
      return;
    }

    this.loading.set(true);

    forkJoin({
      user: this.userService.getById(id),
      roleOptions: this.userService.getRoleOptions(),
    }).subscribe({
      next: ({ user, roleOptions }) => {
        this.user.set(user);
        this.roleOptions.set(roleOptions);
        this.profileForm.patchValue({
          email: user.email,
          firstName: user.firstName ?? '',
          lastName: user.lastName ?? '',
        });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/users']);
      },
    });
  }

  saveProfile(): void {
    if (!this.user() || this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.profileSubmitting.set(true);
    this.errorMsg.set('');

    const raw = this.profileForm.getRawValue();
    const payload: UpdateAdminUserRequest = {
      email: raw.email,
      firstName: raw.firstName || null,
      lastName: raw.lastName || null,
    };

    this.userService.updateUser(this.user()!.id, payload).subscribe({
      next: (updatedUser) => {
        this.user.set(updatedUser);
        this.profileForm.patchValue({
          email: updatedUser.email,
          firstName: updatedUser.firstName ?? '',
          lastName: updatedUser.lastName ?? '',
        });
        this.profileSubmitting.set(false);
        this.successMsg.set('Đã cập nhật hồ sơ người dùng.');
        this.clearSuccessLater();
      },
      error: (error: HttpErrorResponse) => {
        this.profileSubmitting.set(false);
        this.errorMsg.set(error.error?.message || 'Không thể cập nhật hồ sơ người dùng.');
      },
    });
  }

  toggleUserRole(roleCode: string, isChecked: boolean): void {
    const currentUser = this.user();
    if (!currentUser) return;

    let newRoles = [...currentUser.roles];
    if (isChecked) {
      if (!newRoles.includes(roleCode)) newRoles.push(roleCode);
    } else {
      newRoles = newRoles.filter((r) => r !== roleCode);
    }

    if (newRoles.length === 0) {
      this.errorMsg.set('Người dùng phải có ít nhất 1 role.');
      return;
    }

    this.processing.set(true);
    this.errorMsg.set('');

    this.userService.assignRoles(currentUser.id, newRoles).subscribe({
      next: (response) => {
        this.user.set({ ...currentUser, roles: response.assignedRoles });
        this.processing.set(false);
        this.successMsg.set(`Đã cập nhật roles thành công.`);
        this.clearSuccessLater();
      },
      error: (error: HttpErrorResponse) => {
        this.processing.set(false);
        this.errorMsg.set(error.error?.message || 'Không thể cập nhật role người dùng.');
      },
    });
  }

  toggleActive(): void {
    if (!this.user()) {
      return;
    }

    this.processing.set(true);
    this.errorMsg.set('');

    this.userService.toggleActive(this.user()!.id).subscribe({
      next: (updatedUser) => {
        this.user.set(updatedUser);
        this.processing.set(false);
        this.successMsg.set(updatedUser.active ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.');
        this.clearSuccessLater();
      },
      error: (error: HttpErrorResponse) => {
        this.processing.set(false);
        this.errorMsg.set(error.error?.message || 'Không thể cập nhật trạng thái người dùng.');
      },
    });
  }

  getDisplayName(user: AdminUser): string {
    const fullName = `${user.lastName ?? ''} ${user.firstName ?? ''}`.trim();
    return fullName || 'Chưa cập nhật họ tên';
  }

  getUserInitials(user: AdminUser): string {
    const displayName = this.getDisplayName(user);
    if (displayName !== 'Chưa cập nhật họ tên') {
      return displayName
        .split(' ')
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');
    }
    return user.username.charAt(0).toUpperCase();
  }

  getRoleName(roleCode: string): string {
    return this.roleOptions().find((role) => role.code === roleCode)?.name ?? formatRoleCode(roleCode);
  }

  getStatusConfig() {
    return this.user()?.active ? USER_STATUS_CONFIG.active : USER_STATUS_CONFIG.inactive;
  }

  private clearSuccessLater(): void {
    setTimeout(() => this.successMsg.set(''), 3000);
  }
}
