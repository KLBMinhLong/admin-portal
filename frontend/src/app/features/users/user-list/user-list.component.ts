import { Component, OnInit, computed, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { UserManagementService } from '@core/services/user-management.service';
import {
  AdminUser,
  AdminUserRoleOption,
  CreateAdminUserRequest,
  USER_STATUS_CONFIG,
} from '@core/models/user.models';

// Shared Components
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { StatCardComponent } from '@shared/components/stat-card/stat-card.component';
import { SearchBarComponent } from '@shared/components/search-bar/search-bar.component';
import { AlertComponent } from '@shared/components/alert/alert.component';
import { BadgeComponent } from '@shared/components/badge/badge.component';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { CardComponent } from '@shared/components/card/card.component';
import { ToastService } from '@shared/components/toast/toast.service';

// Pipes
import { UserDisplayPipe } from '@shared/pipes/user-display.pipe';
import { RoleDisplayPipe } from '@shared/pipes/role-display.pipe';

// Features Components
import { UserCreateFormComponent } from '@features/users/components/user-create-form/user-create-form.component';

/**
 * User List Component — Smart Component for User Management
 * 
 * Responsibilities:
 *   - Display user list with filtering/search
 *   - Handle user creation, role assignment, status toggle
 *   - Orchestrate API calls via UserManagementService
 *   - Manage local state (selected filters, modal visibility)
 *
 * Refactoring Notes:
 *   - Formatting logic extracted to UserDisplayPipe, RoleDisplayPipe
 *   - Form logic extracted to UserCreateFormComponent
 *   - Reduced from 500+ lines to ~220 lines (SRP compliance)
 *   - Each responsibility has a single, clear method
 */
@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    PageHeaderComponent,
    ButtonComponent,
    StatCardComponent,
    SearchBarComponent,
    AlertComponent,
    BadgeComponent,
    SkeletonComponent,
    EmptyStateComponent,
    ModalComponent,
    CardComponent,
    UserDisplayPipe,
    RoleDisplayPipe,
    UserCreateFormComponent,
  ],
  template: `
    <div class="flex flex-col gap-6">
      <!-- Page Header -->
      <app-page-header
        subtitle="User Management"
        title="Quản lý người dùng"
        description="Quản trị tài khoản, role thực tế trong RBAC, trạng thái hoạt động và thông tin hồ sơ người dùng."
      >
        <div actions class="flex flex-wrap gap-3">
          <app-button
            variant="secondary"
            icon="refresh"
            [disabled]="loading()"
            (click)="loadData()"
          >
            Tải lại
          </app-button>
          <app-button
            icon="plus"
            [disabled]="loading() || roleOptions().length === 0"
            (click)="openCreateModal()"
          >
            Tạo người dùng mới
          </app-button>
        </div>
      </app-page-header>

      <!-- Error Alert -->
      @if (errorMsg()) {
        <app-alert variant="error" [dismissible]="true" (dismissed)="errorMsg.set('')">
          {{ errorMsg() }}
        </app-alert>
      }

      <!-- Stat Cards -->
      <div class="grid gap-4 md:grid-cols-3">
        <app-stat-card
          label="Tổng tài khoản"
          [value]="allUsers().length"
          description="Bao gồm mọi trạng thái và mọi role trong hệ thống."
        />
        <app-stat-card
          label="Đang hoạt động"
          [value]="activeCount()"
          valueColor="text-emerald-600"
          description="Người dùng có thể đăng nhập và thao tác trên hệ thống."
        />
        <app-stat-card
          label="Đã bật 2FA"
          [value]="twoFactorCount()"
          valueColor="text-blue-600"
          description="Tài khoản đang sử dụng xác thực hai lớp."
        />
      </div>

      <!-- Filters -->
      <app-card>
        <div class="grid gap-3 lg:grid-cols-[1.7fr_1fr_1fr]">
          <div>
            <span class="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Tìm kiếm</span>
            <app-search-bar
              placeholder="Username, email, họ tên..."
              [value]="searchQuery()"
              (valueChange)="searchQuery.set($event)"
            />
          </div>

          <div>
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
          </div>

          <div>
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
          </div>
        </div>
      </app-card>

      <!-- Users Table -->
      <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        @if (loading()) {
          <app-skeleton variant="table-row" [rows]="6" [cols]="5" />
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
                    <!-- User Info -->
                    <td class="px-6 py-4">
                      <div class="flex items-start gap-3">
                        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
                          {{ user | userDisplay:'initials' }}
                        </div>
                        <div class="min-w-0">
                          <div class="flex flex-wrap items-center gap-2">
                            <p class="text-sm font-semibold text-slate-900">{{ user.username }}</p>
                            @if (user.emailVerified) {
                              <app-badge variant="success" size="sm">Email đã xác thực</app-badge>
                            }
                          </div>
                          <p class="mt-1 text-sm text-slate-600">{{ user.email }}</p>
                          <p class="mt-1 text-xs text-slate-500">{{ user | userDisplay:'displayName' }}</p>
                          @if (user.roles.length > 0) {
                            <div class="mt-2 flex flex-wrap gap-2">
                              @for (roleCode of user.roles; track roleCode) {
                                <app-badge variant="neutral" size="sm">{{ roleCode | roleDisplay:roleOptions() }}</app-badge>
                              }
                            </div>
                          }
                        </div>
                      </div>
                    </td>

                    <!-- Role Checkboxes -->
                    <td class="px-6 py-4">
                      <div class="flex flex-col gap-2">
                        @for (role of roleOptions(); track role.id) {
                          <label class="flex items-center gap-2">
                            <input type="checkbox"
                                   [checked]="user.roles.includes(role.code)"
                                   (change)="toggleUserRole(user, role.code, $any($event.target).checked)"
                                   [disabled]="isBusy(user.id) || (user.roles.length <= 1 && user.roles.includes(role.code))"
                                   class="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400 disabled:opacity-50" />
                            <span class="text-sm text-slate-700" [class.opacity-50]="isBusy(user.id)">{{ role.name }}</span>
                          </label>
                        }
                      </div>
                    </td>

                    <!-- Status -->
                    <td class="px-6 py-4">
                      <app-badge
                        [variant]="user.active ? 'success' : 'error'"
                        [dot]="true"
                      >
                        {{ user.active ? 'Hoạt động' : 'Đã khóa' }}
                      </app-badge>
                    </td>

                    <!-- Security -->
                    <td class="px-6 py-4 text-sm text-slate-600">
                      <p>{{ user.twoFactorEnabled ? '2FA đã bật' : '2FA chưa bật' }}</p>
                    </td>

                    <!-- Created At -->
                    <td class="px-6 py-4 text-sm text-slate-500">
                      {{ user.createdAt | date:'dd/MM/yyyy HH:mm' }}
                    </td>

                    <!-- Actions -->
                    <td class="px-6 py-4">
                      <div class="flex justify-end gap-2">
                        <app-button
                          variant="secondary"
                          size="sm"
                          [routerLink]="['/users', user.id]"
                        >
                          Xem chi tiết
                        </app-button>
                        <app-button
                          [variant]="user.active ? 'danger' : 'primary'"
                          size="sm"
                          [disabled]="isBusy(user.id)"
                          [loading]="isBusy(user.id)"
                          (click)="toggleActive(user)"
                        >
                          {{ user.active ? 'Khóa' : 'Mở khóa' }}
                        </app-button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6">
                      <app-empty-state
                        icon="users"
                        title="Không tìm thấy người dùng phù hợp"
                        message="Thử thay đổi bộ lọc hoặc tạo người dùng mới."
                      />
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          @if (filteredUsers().length > 0) {
            <div class="border-t border-slate-200 bg-slate-50 px-6 py-3 text-xs text-slate-500">
              Hiển thị {{ filteredUsers().length }} / {{ allUsers().length }} người dùng
            </div>
          }
        }
      </div>
    </div>

    <!-- Create User Modal -->
    <app-modal
      [open]="showCreateModal()"
      title="Tạo người dùng mới"
      subtitle="Create User"
      description="Tài khoản mới sẽ được gán role thật trong hệ RBAC ngay khi tạo."
      size="lg"
      (closed)="closeCreateModal()"
    >
      <app-user-create-form
        [roleOptions]="roleOptions()"
        (submitted)="onCreateUserSubmit($event)"
        (cancelled)="closeCreateModal()"
        #createFormComponent
      />
    </app-modal>
  `,
})
export class UserListComponent implements OnInit {
  // ========== STATE ==========
  allUsers = signal<AdminUser[]>([]);
  roleOptions = signal<AdminUserRoleOption[]>([]);
  loading = signal(true);
  errorMsg = signal('');
  processingUserId = signal<string | null>(null);
  showCreateModal = signal(false);
  searchQuery = signal('');
  selectedRole = signal('');
  selectedStatus = signal('');

  @ViewChild('createFormComponent') createFormComponent!: UserCreateFormComponent;

  // ========== COMPUTED ==========
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
      ].some((value) => value.toLowerCase().includes(query));

      const matchesRole = !selectedRole || user.role === selectedRole;
      const matchesStatus = !selectedStatus || (selectedStatus === 'active' ? user.active : !user.active);

      return matchesQuery && matchesRole && matchesStatus;
    });
  });

  activeCount = computed(() => this.allUsers().filter((user) => user.active).length);
  twoFactorCount = computed(() => this.allUsers().filter((user) => user.twoFactorEnabled).length);

  // ========== LIFECYCLE ==========
  constructor(
    private readonly userService: UserManagementService,
    private readonly toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  // ========== DATA LOADING ==========
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
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.errorMsg.set('Không thể tải dữ liệu quản lý người dùng.');
      },
    });
  }

  // ========== MODAL MANAGEMENT ==========
  openCreateModal(): void {
    this.showCreateModal.set(true);
    // Reset form if needed
    setTimeout(() => {
      if (this.createFormComponent) {
        this.createFormComponent.resetForm();
      }
    });
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  // ========== USER OPERATIONS ==========
  onCreateUserSubmit(payload: CreateAdminUserRequest): void {
    this.createFormComponent.setSubmitting(true);
    this.createFormComponent.clearError();

    this.userService.createUser(payload).subscribe({
      next: (createdUser) => {
        this.allUsers.update((users) => [createdUser, ...users]);
        this.createFormComponent.setSubmitting(false);
        this.closeCreateModal();
        this.toast.success(
          `Đã tạo người dùng "${createdUser.username}" với role "${this.getRoleName(createdUser.role)}".`
        );
      },
      error: (error: HttpErrorResponse) => {
        this.createFormComponent.setSubmitting(false);
        this.createFormComponent.setError(error.error?.message || 'Không thể tạo người dùng mới.');
      },
    });
  }

  toggleUserRole(user: AdminUser, roleCode: string, isChecked: boolean): void {
    let newRoles = [...user.roles];
    if (isChecked) {
      if (!newRoles.includes(roleCode)) newRoles.push(roleCode);
    } else {
      newRoles = newRoles.filter((r) => r !== roleCode);
    }

    if (newRoles.length === 0) {
      this.errorMsg.set('Người dùng phải có ít nhất 1 role.');
      return;
    }

    this.processingUserId.set(user.id);
    this.errorMsg.set('');

    this.userService.assignRoles(user.id, newRoles).subscribe({
      next: (response) => {
        const updatedUser = { ...user, roles: response.assignedRoles };
        this.upsertUser(updatedUser);
        this.processingUserId.set(null);
        this.toast.success(`Đã cập nhật role cho "${user.username}".`);
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
        this.toast.success(
          updatedUser.active
            ? `Đã mở khóa tài khoản "${updatedUser.username}".`
            : `Đã khóa tài khoản "${updatedUser.username}".`
        );
      },
      error: (error: HttpErrorResponse) => {
        this.processingUserId.set(null);
        this.errorMsg.set(error.error?.message || 'Không thể cập nhật trạng thái người dùng.');
      },
    });
  }

  // ========== HELPERS ==========
  isBusy(userId: string): boolean {
    return this.processingUserId() === userId;
  }

  getRoleName(roleCode: string): string {
    return this.roleOptions().find((role) => role.code === roleCode)?.name ?? roleCode;
  }

  private upsertUser(updatedUser: AdminUser): void {
    this.allUsers.update((users) =>
      users.map((user) => (user.id === updatedUser.id ? updatedUser : user))
    );
  }
}
