import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UserManagementService } from '@core/services/user-management.service';
import { AdminUser, USER_STATUS_CONFIG, ROLE_OPTIONS } from '@core/models/user.models';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <h1 class="text-2xl font-bold text-slate-900">Quản lý Người dùng</h1>
    </div>

    @if (errorMsg()) {
      <div class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700" role="alert">
        {{ errorMsg() }}
      </div>
    }

    @if (successMsg()) {
      <div class="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
        {{ successMsg() }}
      </div>
    }

    <!-- Filters -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="flex-1">
          <input type="text" [(ngModel)]="searchQuery" placeholder="Tìm theo username hoặc email..."
            class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm
                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200" />
        </div>
        <select [(ngModel)]="filterRole"
          class="px-3 py-2 border border-slate-300 rounded-lg text-sm
                 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer">
          <option value="">Tất cả Role</option>
          @for (r of roleOptions; track r.value) {
            <option [value]="r.value">{{ r.label }}</option>
          }
        </select>
        <select [(ngModel)]="filterStatus"
          class="px-3 py-2 border border-slate-300 rounded-lg text-sm
                 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer">
          <option value="">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="inactive">Đã khóa</option>
        </select>
      </div>
    </div>

    @if (loading()) {
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="space-y-0">
          @for (i of [1,2,3,4,5]; track i) {
            <div class="flex items-center gap-4 px-6 py-4 border-b border-slate-100">
              <div class="skeleton w-9 h-9 rounded-full"></div>
              <div class="flex-1 space-y-2">
                <div class="skeleton h-4 w-40"></div>
                <div class="skeleton h-3 w-60"></div>
              </div>
              <div class="skeleton h-6 w-20 rounded-full"></div>
            </div>
          }
        </div>
      </div>
    } @else {
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <!-- Table header -->
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200">
                <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Người dùng</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">2FA</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Ngày tạo</th>
                <th class="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody>
              @for (user of filteredUsers(); track user.id) {
                <tr class="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <!-- User info -->
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
                        [class]="user.active ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'">
                        {{ user.username.charAt(0).toUpperCase() }}
                      </div>
                      <div class="min-w-0">
                        <p class="text-sm font-medium text-slate-900 truncate">{{ user.username }}</p>
                        <p class="text-xs text-slate-500 truncate">{{ user.email }}</p>
                      </div>
                    </div>
                  </td>

                  <!-- Role -->
                  <td class="px-6 py-4">
                    <select [ngModel]="user.role" (ngModelChange)="onRoleChange(user, $event)"
                      class="px-2 py-1 border border-slate-200 rounded text-xs text-slate-700
                             focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer bg-white">
                      @for (r of roleOptions; track r.value) {
                        <option [value]="r.value">{{ r.label }}</option>
                      }
                    </select>
                  </td>

                  <!-- Status badge -->
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border"
                      [class]="user.active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'">
                      {{ user.active ? 'Hoạt động' : 'Đã khóa' }}
                    </span>
                  </td>

                  <!-- 2FA -->
                  <td class="px-6 py-4">
                    @if (user.twoFactorEnabled) {
                      <span class="inline-flex items-center gap-1 text-xs text-green-600">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                        Bật
                      </span>
                    } @else {
                      <span class="text-xs text-slate-400">Tắt</span>
                    }
                  </td>

                  <!-- Created -->
                  <td class="px-6 py-4 text-sm text-slate-500">
                    {{ user.createdAt | date:'dd/MM/yyyy' }}
                  </td>

                  <!-- Actions -->
                  <td class="px-6 py-4 text-right">
                    <button (click)="toggleActive(user)"
                      [disabled]="processing() === user.id"
                      [title]="user.active ? 'Khóa tài khoản' : 'Mở khóa tài khoản'"
                      class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg
                             transition-colors duration-200 cursor-pointer border
                             disabled:opacity-50 disabled:cursor-not-allowed"
                      [class]="user.active
                        ? 'text-red-600 border-red-200 hover:bg-red-50'
                        : 'text-green-600 border-green-200 hover:bg-green-50'">
                      @if (processing() === user.id) {
                        ...
                      } @else if (user.active) {
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                        Khóa
                      } @else {
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                        Mở khóa
                      }
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="px-6 py-12 text-center">
                    <svg class="w-12 h-12 text-slate-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round"
                        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                    <p class="text-sm font-medium text-slate-900">Không tìm thấy người dùng</p>
                    <p class="text-xs text-slate-500 mt-1">Thử thay đổi bộ lọc tìm kiếm.</p>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Summary -->
        <div class="px-6 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
          Hiển thị {{ filteredUsers().length }} / {{ allUsers().length }} người dùng
        </div>
      </div>
    }
  `,
})
export class UserListComponent implements OnInit {
  allUsers = signal<AdminUser[]>([]);
  loading = signal(true);
  processing = signal<string | null>(null);
  errorMsg = signal('');
  successMsg = signal('');

  searchQuery = '';
  filterRole = '';
  filterStatus = '';
  roleOptions = ROLE_OPTIONS;

  filteredUsers = computed(() => {
    let users = this.allUsers();
    const q = this.searchQuery.toLowerCase().trim();
    if (q) {
      users = users.filter(u =>
        u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }
    if (this.filterRole) {
      users = users.filter(u => u.role === this.filterRole);
    }
    if (this.filterStatus === 'active') {
      users = users.filter(u => u.active);
    } else if (this.filterStatus === 'inactive') {
      users = users.filter(u => !u.active);
    }
    return users;
  });

  constructor(private userService: UserManagementService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  toggleActive(user: AdminUser): void {
    this.processing.set(user.id);
    this.errorMsg.set('');
    this.successMsg.set('');

    this.userService.toggleActive(user.id).subscribe({
      next: (updated) => {
        this.updateUserInList(updated);
        this.processing.set(null);
        this.successMsg.set(
          updated.active
            ? `Đã mở khóa tài khoản "${updated.username}".`
            : `Đã khóa tài khoản "${updated.username}".`
        );
        setTimeout(() => this.successMsg.set(''), 3000);
      },
      error: (err: HttpErrorResponse) => {
        this.processing.set(null);
        this.errorMsg.set(err.error?.message || 'Lỗi khi thay đổi trạng thái.');
      },
    });
  }

  onRoleChange(user: AdminUser, newRole: string): void {
    if (newRole === user.role) return;
    this.processing.set(user.id);
    this.errorMsg.set('');

    this.userService.updateRole(user.id, newRole).subscribe({
      next: (updated) => {
        this.updateUserInList(updated);
        this.processing.set(null);
        this.successMsg.set(`Đã cập nhật role của "${updated.username}" thành "${newRole}".`);
        setTimeout(() => this.successMsg.set(''), 3000);
      },
      error: (err: HttpErrorResponse) => {
        this.processing.set(null);
        this.errorMsg.set(err.error?.message || 'Lỗi khi cập nhật role.');
      },
    });
  }

  private loadUsers(): void {
    this.userService.getAll().subscribe({
      next: (users) => {
        this.allUsers.set(users);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.errorMsg.set('Không thể tải danh sách người dùng.');
      },
    });
  }

  private updateUserInList(updated: AdminUser): void {
    this.allUsers.update(users =>
      users.map(u => (u.id === updated.id ? updated : u))
    );
  }
}
