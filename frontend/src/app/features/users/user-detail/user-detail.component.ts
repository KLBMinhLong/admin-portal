import { Component, OnInit, signal, inject } from '@angular/core';
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
import { ToastService } from '@shared/components/toast/toast.service';
import { 
  PageHeaderComponent, CardComponent, ButtonComponent, BadgeComponent,
  FormFieldComponent, InputComponent, SkeletonComponent
} from '@shared/components';
import { UserDisplayPipe } from '@shared/pipes/user-display.pipe';
import { RoleDisplayPipe } from '@shared/pipes/role-display.pipe';
import { RoleManagementModalComponent } from '@features/users/components/role-management-modal/role-management-modal.component';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    CardComponent, ButtonComponent, BadgeComponent,
    FormFieldComponent, InputComponent, SkeletonComponent,
    UserDisplayPipe, RoleDisplayPipe, RoleManagementModalComponent
  ],
  template: `
    @if (loading()) {
      <div class="space-y-6">
        <app-skeleton variant="text" width="200px" height="32px" />
        <app-skeleton variant="rect" height="300px" />
      </div>
    } @else if (user()) {
      <div class="space-y-6">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
          <div class="flex items-start gap-4">
            <a
              routerLink="/users"
              class="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </a>
            <div class="flex items-start gap-4">
              <div class="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-900 text-lg font-semibold text-white shadow-sm">
                {{ user()! | userDisplay:'initials' }}
              </div>
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">User Detail</p>
                <h1 class="mt-1 text-3xl font-bold tracking-tight text-slate-900">{{ user()!.username }}</h1>
                <p class="mt-1 text-sm text-slate-500">{{ user()!.email }}</p>
                <div class="mt-3 flex flex-wrap gap-2">
                  <app-badge [variant]="user()!.active ? 'success' : 'neutral'">
                    {{ getStatusConfig().label }}
                  </app-badge>
                  <app-badge variant="info">
                    {{ user()!.roles.length > 0 ? (user()!.roles[0] | roleDisplay:roleOptions()) : 'Chưa có role' }}
                  </app-badge>
                </div>
              </div>
            </div>
          </div>
          <div class="flex flex-wrap gap-3">
            <app-button
              type="button"
              (click)="toggleActive()"
              [loading]="processing()"
              [variant]="user()!.active ? 'danger' : 'primary'"
            >
              {{ user()!.active ? 'Khóa tài khoản' : 'Mở khóa tài khoản' }}
            </app-button>
          </div>
        </div>

        <div class="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <!-- Left Column -->
          <div class="space-y-6">
            <app-card>
              <h2 class="text-lg font-bold text-slate-900">Thông tin hồ sơ</h2>
              <p class="mt-1 text-sm text-slate-500">Cập nhật email và thông tin hiển thị của người dùng.</p>

              <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="mt-6 grid gap-4 md:grid-cols-2">
                <div class="md:col-span-2">
                  <app-form-field label="Email" fieldId="email" [required]="true" [error]="getFieldError('email')">
                    <app-input formControlName="email" type="email" [hasError]="hasFieldError('email')" />
                  </app-form-field>
                </div>

                <app-form-field label="Tên" fieldId="firstName">
                  <app-input formControlName="firstName" type="text" />
                </app-form-field>

                <app-form-field label="Họ" fieldId="lastName">
                  <app-input formControlName="lastName" type="text" />
                </app-form-field>

                <div class="md:col-span-2 flex justify-end pt-2">
                  <app-button
                    type="submit"
                    variant="primary"
                    [disabled]="profileForm.invalid"
                    [loading]="profileSubmitting()"
                  >
                    Lưu thông tin
                  </app-button>
                </div>
              </form>
            </app-card>

            <app-card>
              <h2 class="text-lg font-bold text-slate-900">Metadata tài khoản</h2>
              <div class="mt-6 grid gap-4 md:grid-cols-2">
                <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Họ và tên</p>
                  <p class="mt-2 text-sm font-medium text-slate-900">{{ user()! | userDisplay:'displayName' }}</p>
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
            </app-card>
          </div>

          <!-- Right Column -->
          <div class="space-y-6">
            <app-card>
              <h2 class="text-lg font-bold text-slate-900">Role và truy cập</h2>
              <div class="mt-5 space-y-4">
                <!-- Current Roles -->
                <div>
                  <h3 class="mb-3 text-sm font-medium text-slate-700">
                    Các Role hiện tại
                    @if ((user()!.roles.length || 0) === 0) {
                      <span class="ml-1 text-slate-500">(Chưa có)</span>
                    }
                  </h3>
                  @if ((user()!.roles.length || 0) > 0) {
                    <div class="flex flex-wrap gap-3">
                      @for (roleCode of user()!.roles; track roleCode) {
                        <div class="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2">
                          <span class="text-sm font-medium text-slate-800">
                            {{ roleCode | roleDisplay:roleOptions() }}
                          </span>
                          <button
                            type="button"
                            (click)="confirmRemoveRole(roleCode)"
                            [disabled]="processing() || cannotRemoveRole()"
                            class="ml-1 text-slate-500 transition hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Xóa role"
                          >
                            <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
                            </svg>
                          </button>
                        </div>
                      }
                    </div>
                  } @else {
                    <div class="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                      Người dùng chưa được gán role nào. Vui lòng thêm role bên dưới.
                    </div>
                  }
                </div>

                <!-- Add Role Button -->
                <div class="pt-2">
                  <app-button
                    type="button"
                    variant="primary"
                    size="sm"
                    [disabled]="processing() || roleOptions().length === 0 || (user()!.roles.length || 0) >= roleOptions().length"
                    (click)="openRoleModal()"
                  >
                    + Thêm Role
                  </app-button>
                </div>
              </div>
            </app-card>

            <app-card>
              <h2 class="text-lg font-bold text-slate-900">Bảo mật</h2>
              <div class="mt-5 space-y-3">
                <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Email</p>
                  <p class="mt-2 text-sm font-medium" [class]="user()!.emailVerified ? 'text-emerald-700' : 'text-amber-700'">
                    {{ user()!.emailVerified ? 'Đã xác thực' : 'Chưa xác thực' }}
                  </p>
                </div>
                <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Xác thực hai lớp (2FA)</p>
                  <p class="mt-2 text-sm font-medium" [class]="user()!.twoFactorEnabled ? 'text-emerald-700' : 'text-slate-600'">
                    {{ user()!.twoFactorEnabled ? 'Đã bật 2FA' : 'Chưa bật' }}
                  </p>
                </div>
              </div>
            </app-card>
          </div>
        </div>
      </div>
    }

    <!-- Role Management Modal -->
    <app-role-management-modal
      [open]="showRoleModal()"
      [allRoles]="roleOptions()"
      [currentRoleCodes]="user()?.roles || []"
      [loading]="processing()"
      (roleAdded)="addRole($event)"
      (cancelled)="closeRoleModal()"
    />
  `,
})
export class UserDetailComponent implements OnInit {
  user = signal<AdminUser | null>(null);
  roleOptions = signal<AdminUserRoleOption[]>([]);
  loading = signal(true);
  processing = signal(false);
  profileSubmitting = signal(false);
  showRoleModal = signal(false);

  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly userService = inject(UserManagementService);
  private readonly toastService = inject(ToastService);

  profileForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    firstName: [''],
    lastName: [''],
  });

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
        this.toastService.error('Không thể tải thông tin người dùng.');
        this.router.navigate(['/users']);
      },
    });
  }

  hasFieldError(field: string): boolean {
    const control = this.profileForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getFieldError(field: string): string {
    const control = this.profileForm.get(field);
    if (!control || !control.errors || (!control.dirty && !control.touched)) return '';
    if (control.errors['required']) return 'Trường này là bắt buộc';
    if (control.errors['email']) return 'Email không hợp lệ';
    return 'Dữ liệu không hợp lệ';
  }

  saveProfile(): void {
    if (!this.user() || this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.profileSubmitting.set(true);

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
        this.toastService.success('Đã cập nhật hồ sơ người dùng.');
      },
      error: (error: HttpErrorResponse) => {
        this.profileSubmitting.set(false);
        this.toastService.error(error.error?.message || 'Không thể cập nhật hồ sơ người dùng.');
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
      this.toastService.error('Người dùng phải có ít nhất 1 role.');
      return;
    }

    this.processing.set(true);

    this.userService.assignRoles(currentUser.id, newRoles).subscribe({
      next: (response) => {
        this.user.set({ ...currentUser, roles: response.assignedRoles });
        this.processing.set(false);
        this.toastService.success('Đã cập nhật roles thành công.');
      },
      error: (error: HttpErrorResponse) => {
        this.processing.set(false);
        this.toastService.error(error.error?.message || 'Không thể cập nhật role người dùng.');
      },
    });
  }

  openRoleModal(): void {
    this.showRoleModal.set(true);
  }

  closeRoleModal(): void {
    this.showRoleModal.set(false);
  }

  addRole(roleCode: string): void {
    const currentUser = this.user();
    if (!currentUser || !roleCode) return;

    const newRoles = [...(currentUser.roles || []), roleCode];
    this.processing.set(true);
    this.showRoleModal.set(false);

    this.userService.assignRoles(currentUser.id, newRoles).subscribe({
      next: (response) => {
        const assignedRoles = response?.assignedRoles || newRoles || [];
        this.user.set({ ...currentUser, roles: assignedRoles });
        this.processing.set(false);
        this.toastService.success(`Đã thêm role thành công.`);
      },
      error: (error: HttpErrorResponse) => {
        this.processing.set(false);
        this.showRoleModal.set(false);
        this.toastService.error(error.error?.message || 'Không thể thêm role.');
      },
    });
  }

  confirmRemoveRole(roleCode: string): void {
    const currentUser = this.user();
    if (!currentUser || currentUser.roles.length <= 1) return;

    const roleName = this.roleOptions().find(r => r.code === roleCode)?.name || roleCode;
    const confirmed = confirm(`Xác nhận xóa role "${roleName}"?`);

    if (confirmed) {
      this.removeRole(roleCode);
    }
  }

  removeRole(roleCode: string): void {
    const currentUser = this.user();
    if (!currentUser) return;

    const newRoles = (currentUser.roles || []).filter(r => r !== roleCode);

    if (newRoles.length === 0) {
      this.toastService.error('Người dùng phải có ít nhất 1 role.');
      this.processing.set(false);
      return;
    }

    this.processing.set(true);

    this.userService.assignRoles(currentUser.id, newRoles).subscribe({
      next: (response) => {
        const assignedRoles = response?.assignedRoles || newRoles || [];
        this.user.set({ ...currentUser, roles: assignedRoles });
        this.processing.set(false);
        this.toastService.success('Đã xóa role thành công.');
      },
      error: (error: HttpErrorResponse) => {
        this.processing.set(false);
        this.toastService.error(error.error?.message || 'Không thể xóa role.');
      },
    });
  }

  cannotRemoveRole(): boolean {
    return (this.user()?.roles?.length || 0) <= 1;
  }

  toggleActive(): void {
    if (!this.user()) {
      return;
    }

    this.processing.set(true);

    this.userService.toggleActive(this.user()!.id).subscribe({
      next: (updatedUser) => {
        this.user.set(updatedUser);
        this.processing.set(false);
        this.toastService.success(updatedUser.active ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.');
      },
      error: (error: HttpErrorResponse) => {
        this.processing.set(false);
        this.toastService.error(error.error?.message || 'Không thể cập nhật trạng thái người dùng.');
      },
    });
  }

  getStatusConfig() {
    return this.user()?.active ? USER_STATUS_CONFIG.active : USER_STATUS_CONFIG.inactive;
  }
}
