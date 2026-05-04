import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { UserManagementService } from '@core/services/user-management.service';
import {
  AdminUser,
  AdminUserRoleOption,
  CreateAdminUserRequest,
  USER_STATUS_CONFIG,
  formatRoleCode,
} from '@core/models/user.models';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="flex flex-col gap-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">User Management</p>
          <h1 class="mt-2 text-3xl font-bold tracking-tight text-slate-900">Quản lý người dùng</h1>
          <p class="mt-2 max-w-2xl text-sm text-slate-600">
            Quản trị tài khoản, role thực tế trong RBAC, trạng thái hoạt động và thông tin hồ sơ người dùng.
          </p>
        </div>
        <div class="flex flex-wrap gap-3">
          <button
            type="button"
            (click)="loadData()"
            [disabled]="loading()"
            class="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Tải lại
          </button>
          <button
            type="button"
            (click)="openCreateModal()"
            [disabled]="loading() || roleOptions().length === 0"
            class="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Tạo người dùng mới
          </button>
        </div>
      </div>

      @if (errorMsg()) {
        <div class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {{ errorMsg() }}
        </div>
      }

      @if (successMsg()) {
        <div class="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {{ successMsg() }}
        </div>
      }

      <div class="grid gap-4 md:grid-cols-3">
        <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Tổng tài khoản</p>
          <p class="mt-3 text-3xl font-bold text-slate-900">{{ allUsers().length }}</p>
          <p class="mt-2 text-sm text-slate-500">Bao gồm mọi trạng thái và mọi role trong hệ thống.</p>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Đang hoạt động</p>
          <p class="mt-3 text-3xl font-bold text-emerald-600">{{ activeCount() }}</p>
          <p class="mt-2 text-sm text-slate-500">Người dùng có thể đăng nhập và thao tác trên hệ thống.</p>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Đã bật 2FA</p>
          <p class="mt-3 text-3xl font-bold text-blue-600">{{ twoFactorCount() }}</p>
          <p class="mt-2 text-sm text-slate-500">Tài khoản đang sử dụng xác thực hai lớp.</p>
        </div>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div class="grid gap-3 lg:grid-cols-[1.7fr_1fr_1fr]">
          <label class="block">
            <span class="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Tìm kiếm</span>
            <input
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
              type="text"
              placeholder="Username, email, họ tên..."
              class="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
            />
          </label>

          <label class="block">
            <span class="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Role</span>
            <select
              [ngModel]="selectedRole()"
              (ngModelChange)="selectedRole.set($event)"
              class="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
            >
              <option value="">Tất cả role</option>
              @for (role of roleOptions(); track role.id) {
                <option [value]="role.code">{{ role.name }}</option>
              }
            </select>
          </label>

          <label class="block">
            <span class="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Trạng thái</span>
            <select
              [ngModel]="selectedStatus()"
              (ngModelChange)="selectedStatus.set($event)"
              class="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Đã khóa</option>
            </select>
          </label>
        </div>
      </div>

      <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        @if (loading()) {
          <div class="space-y-0">
            @for (item of [1, 2, 3, 4, 5, 6]; track item) {
              <div class="grid grid-cols-[2.2fr_1.1fr_0.9fr_0.9fr_1fr] gap-4 border-b border-slate-100 px-6 py-4">
                <div class="skeleton h-10 w-full rounded-xl"></div>
                <div class="skeleton h-10 w-full rounded-xl"></div>
                <div class="skeleton h-10 w-full rounded-xl"></div>
                <div class="skeleton h-10 w-full rounded-xl"></div>
                <div class="skeleton h-10 w-full rounded-xl"></div>
              </div>
            }
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200">
              <thead class="bg-slate-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Người dùng</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Role</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Trạng thái</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Bảo mật</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tạo lúc</th>
                  <th class="px-6 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Hành động</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (user of filteredUsers(); track user.id) {
                  <tr class="align-top transition hover:bg-slate-50/70">
                    <td class="px-6 py-4">
                      <div class="flex items-start gap-3">
                        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
                          {{ getUserInitials(user) }}
                        </div>
                        <div class="min-w-0">
                          <div class="flex flex-wrap items-center gap-2">
                            <p class="text-sm font-semibold text-slate-900">{{ user.username }}</p>
                            @if (user.emailVerified) {
                              <span class="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">Email đã xác thực</span>
                            }
                          </div>
                          <p class="mt-1 text-sm text-slate-600">{{ user.email }}</p>
                          <p class="mt-1 text-xs text-slate-500">{{ getDisplayName(user) }}</p>
                          @if (user.roles.length > 0) {
                            <div class="mt-2 flex flex-wrap gap-2">
                              @for (roleCode of user.roles; track roleCode) {
                                <span class="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                                  {{ getRoleName(roleCode) }}
                                </span>
                              }
                            </div>
                          }
                        </div>
                      </div>
                    </td>

                    <td class="px-6 py-4">
                      <select
                        [ngModel]="user.role"
                        (ngModelChange)="changeRole(user, $event)"
                        [disabled]="isBusy(user.id)"
                        class="w-full min-w-44 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        @for (role of roleOptions(); track role.id) {
                          <option [value]="role.code">{{ role.name }}</option>
                        }
                      </select>
                      <p class="mt-1 text-xs text-slate-500">{{ user.role }}</p>
                    </td>

                    <td class="px-6 py-4">
                      <span class="inline-flex rounded-full border px-2.5 py-1 text-xs font-medium" [class]="getStatusConfig(user).class">
                        {{ getStatusConfig(user).label }}
                      </span>
                    </td>

                    <td class="px-6 py-4 text-sm text-slate-600">
                      <p>{{ user.twoFactorEnabled ? '2FA đã bật' : '2FA chưa bật' }}</p>
                    </td>

                    <td class="px-6 py-4 text-sm text-slate-500">
                      {{ user.createdAt | date:'dd/MM/yyyy HH:mm' }}
                    </td>

                    <td class="px-6 py-4">
                      <div class="flex justify-end gap-2">
                        <a
                          [routerLink]="['/users', user.id]"
                          class="inline-flex items-center rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                        >
                          Xem chi tiết
                        </a>
                        <button
                          type="button"
                          (click)="toggleActive(user)"
                          [disabled]="isBusy(user.id)"
                          class="inline-flex items-center rounded-xl border px-3 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
                          [class]="user.active
                            ? 'border-red-200 text-red-700 hover:bg-red-50'
                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'"
                        >
                          {{ isBusy(user.id) ? 'Đang xử lý...' : (user.active ? 'Khóa' : 'Mở khóa') }}
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="px-6 py-16 text-center">
                      <p class="text-sm font-semibold text-slate-900">Không tìm thấy người dùng phù hợp</p>
                      <p class="mt-2 text-sm text-slate-500">Thử thay đổi bộ lọc hoặc tạo người dùng mới.</p>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="border-t border-slate-200 bg-slate-50 px-6 py-3 text-xs text-slate-500">
            Hiển thị {{ filteredUsers().length }} / {{ allUsers().length }} người dùng
          </div>
        }
      </div>
    </div>

    @if (showCreateModal()) {
      <div class="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm"></div>
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div class="flex items-start justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Create User</p>
              <h2 class="mt-2 text-xl font-bold text-slate-900">Tạo người dùng mới</h2>
              <p class="mt-1 text-sm text-slate-500">Tài khoản mới sẽ được gán role thật trong hệ RBAC ngay khi tạo.</p>
            </div>
            <button
              type="button"
              (click)="closeCreateModal()"
              class="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              ✕
            </button>
          </div>

          <form [formGroup]="createForm" (ngSubmit)="submitCreateUser()" class="space-y-5 px-6 py-6">
            <div class="grid gap-4 md:grid-cols-2">
              <label class="block">
                <span class="mb-1.5 block text-sm font-medium text-slate-700">Username</span>
                <input formControlName="username" type="text" class="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200" />
              </label>

              <label class="block">
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

              <label class="block md:col-span-2">
                <span class="mb-1.5 block text-sm font-medium text-slate-700">Mật khẩu</span>
                <input formControlName="password" type="password" class="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200" />
                <p class="mt-1 text-xs text-slate-500">Ít nhất 12 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.</p>
              </label>

              <label class="block">
                <span class="mb-1.5 block text-sm font-medium text-slate-700">Role</span>
                <select formControlName="roleCode" class="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200">
                  @for (role of roleOptions(); track role.id) {
                    <option [value]="role.code">{{ role.name }}</option>
                  }
                </select>
              </label>

              <label class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <input formControlName="active" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400" />
                <span>
                  <span class="block text-sm font-medium text-slate-700">Kích hoạt ngay</span>
                  <span class="block text-xs text-slate-500">Nếu bỏ chọn, tài khoản được tạo nhưng chưa thể đăng nhập.</span>
                </span>
              </label>
            </div>

            @if (createFormError()) {
              <div class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {{ createFormError() }}
              </div>
            }

            <div class="flex justify-end gap-3 border-t border-slate-200 pt-5">
              <button
                type="button"
                (click)="closeCreateModal()"
                class="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                [disabled]="createForm.invalid || createSubmitting()"
                class="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {{ createSubmitting() ? 'Đang tạo...' : 'Tạo người dùng' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class UserListComponent implements OnInit {
  allUsers = signal<AdminUser[]>([]);
  roleOptions = signal<AdminUserRoleOption[]>([]);
  loading = signal(true);
  errorMsg = signal('');
  successMsg = signal('');
  processingUserId = signal<string | null>(null);
  showCreateModal = signal(false);
  createSubmitting = signal(false);
  createFormError = signal('');
  searchQuery = signal('');
  selectedRole = signal('');
  selectedStatus = signal('');

  createForm = this.formBuilder.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z0-9_]+$/)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(12)]],
    firstName: [''],
    lastName: [''],
    roleCode: ['', Validators.required],
    active: [true],
  });

  filteredUsers = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const selectedRole = this.selectedRole();
    const selectedStatus = this.selectedStatus();

    return this.allUsers().filter((user) => {
      const matchesQuery = !query || [
        user.username,
        user.email,
        user.firstName ?? '',
        user.lastName ?? '',
        this.getDisplayName(user),
      ].some((value) => value.toLowerCase().includes(query));

      const matchesRole = !selectedRole || user.role === selectedRole;
      const matchesStatus = !selectedStatus || (selectedStatus === 'active' ? user.active : !user.active);

      return matchesQuery && matchesRole && matchesStatus;
    });
  });

  activeCount = computed(() => this.allUsers().filter((user) => user.active).length);
  twoFactorCount = computed(() => this.allUsers().filter((user) => user.twoFactorEnabled).length);

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly userService: UserManagementService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.errorMsg.set('');

    forkJoin({
      users: this.userService.getAll(),
      roleOptions: this.userService.getRoleOptions(),
    }).subscribe({
      next: ({ users, roleOptions }) => {
        this.allUsers.set(users);
        this.roleOptions.set(roleOptions);
        if (!this.createForm.controls.roleCode.value && roleOptions.length > 0) {
          this.createForm.patchValue({ roleCode: roleOptions[0].code });
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.errorMsg.set('Không thể tải dữ liệu quản lý người dùng.');
      },
    });
  }

  openCreateModal(): void {
    this.createForm.reset({
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      roleCode: this.roleOptions()[0]?.code ?? '',
      active: true,
    });
    this.createFormError.set('');
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
    this.createSubmitting.set(false);
    this.createFormError.set('');
  }

  submitCreateUser(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.createSubmitting.set(true);
    this.createFormError.set('');

    const raw = this.createForm.getRawValue();
    const payload: CreateAdminUserRequest = {
      username: raw.username,
      email: raw.email,
      password: raw.password,
      firstName: raw.firstName || null,
      lastName: raw.lastName || null,
      roleCode: raw.roleCode,
      active: raw.active,
    };

    this.userService.createUser(payload).subscribe({
      next: (createdUser) => {
        this.allUsers.update((users) => [createdUser, ...users]);
        this.createSubmitting.set(false);
        this.showCreateModal.set(false);
        this.successMsg.set(`Đã tạo người dùng "${createdUser.username}" với role "${this.getRoleName(createdUser.role)}".`);
        this.clearSuccessLater();
      },
      error: (error: HttpErrorResponse) => {
        this.createSubmitting.set(false);
        this.createFormError.set(error.error?.message || 'Không thể tạo người dùng mới.');
      },
    });
  }

  changeRole(user: AdminUser, roleCode: string): void {
    if (!roleCode || roleCode === user.role) {
      return;
    }

    this.processingUserId.set(user.id);
    this.errorMsg.set('');

    this.userService.updateRole(user.id, roleCode).subscribe({
      next: (updatedUser) => {
        this.upsertUser(updatedUser);
        this.processingUserId.set(null);
        this.successMsg.set(`Đã cập nhật role của "${updatedUser.username}" thành "${this.getRoleName(updatedUser.role)}".`);
        this.clearSuccessLater();
      },
      error: (error: HttpErrorResponse) => {
        this.processingUserId.set(null);
        this.errorMsg.set(error.error?.message || 'Không thể cập nhật role người dùng.');
        this.loadData();
      },
    });
  }

  toggleActive(user: AdminUser): void {
    this.processingUserId.set(user.id);
    this.errorMsg.set('');

    this.userService.toggleActive(user.id).subscribe({
      next: (updatedUser) => {
        this.upsertUser(updatedUser);
        this.processingUserId.set(null);
        this.successMsg.set(
          updatedUser.active
            ? `Đã mở khóa tài khoản "${updatedUser.username}".`
            : `Đã khóa tài khoản "${updatedUser.username}".`
        );
        this.clearSuccessLater();
      },
      error: (error: HttpErrorResponse) => {
        this.processingUserId.set(null);
        this.errorMsg.set(error.error?.message || 'Không thể cập nhật trạng thái người dùng.');
      },
    });
  }

  isBusy(userId: string): boolean {
    return this.processingUserId() === userId;
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

  getStatusConfig(user: AdminUser) {
    return user.active ? USER_STATUS_CONFIG.active : USER_STATUS_CONFIG.inactive;
  }

  private upsertUser(updatedUser: AdminUser): void {
    this.allUsers.update((users) =>
      users.map((user) => (user.id === updatedUser.id ? updatedUser : user))
    );
  }

  private clearSuccessLater(): void {
    setTimeout(() => this.successMsg.set(''), 3000);
  }
}
