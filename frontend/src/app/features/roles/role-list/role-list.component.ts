import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleManagementService } from '@core/services/role-management.service';
import { AdminRole } from '@core/models/role.models';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Danh sách Role</h1>
        <p class="text-sm text-slate-500 mt-1">Quản lý các chức danh và vai trò trong hệ thống</p>
      </div>
      <button (click)="openCreateModal()"
        class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium
               rounded-lg transition-colors duration-200 cursor-pointer shadow-sm">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Thêm Role mới
      </button>
    </div>

    @if (errorMsg()) {
      <div class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
        {{ errorMsg() }}
      </div>
    }

    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-200">
            <th class="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Mã Role</th>
            <th class="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Tên hiển thị</th>
            <th class="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Trạng thái</th>
            <th class="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          @for (role of roles(); track role.id) {
            <tr class="hover:bg-slate-50/50 transition-colors">
              <td class="px-6 py-4">
                <code class="text-xs font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded">{{ role.code }}</code>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm font-medium text-slate-900">{{ role.name }}</div>
                <div class="text-xs text-slate-500">{{ role.description }}</div>
              </td>
              <td class="px-6 py-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  [ngClass]="role.active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'">
                  {{ role.active ? 'Đang hoạt động' : 'Vô hiệu hóa' }}
                </span>
              </td>
              <td class="px-6 py-4 text-right space-x-2">
                <button (click)="openEditModal(role)" class="text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer">Sửa</button>
                <button (click)="toggleActive(role)" 
                  class="text-sm font-medium cursor-pointer"
                  [ngClass]="role.active ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'">
                  {{ role.active ? 'Vô hiệu hóa' : 'Kích hoạt' }}
                </button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    <!-- Modal (Overlay) -->
    @if (showModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <div class="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
          <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 class="text-lg font-bold text-slate-900">{{ isEdit() ? 'Cập nhật Role' : 'Thêm Role mới' }}</h3>
            <button (click)="closeModal()" class="text-slate-400 hover:text-slate-600">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1">Mã Role</label>
              <input type="text" [(ngModel)]="formRole().code" [disabled]="isEdit()"
                placeholder="VD: FINANCE_MANAGER"
                class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:opacity-50" />
              <p class="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Mã định danh duy nhất, không chứa khoảng trắng</p>
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1">Tên hiển thị</label>
              <input type="text" [(ngModel)]="formRole().name"
                placeholder="VD: Quản lý Tài chính"
                class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1">Mô tả</label>
              <textarea [(ngModel)]="formRole().description" rows="3"
                placeholder="Mô tả chức năng của role này..."
                class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"></textarea>
            </div>
          </div>
          <div class="px-6 py-4 bg-slate-50 flex gap-3 justify-end">
            <button (click)="closeModal()" class="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">Hủy</button>
            <button (click)="saveRole()" 
              [disabled]="!formRole().code || !formRole().name"
              class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-all shadow-sm disabled:opacity-50">
              Lưu thông tin
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class RoleListComponent implements OnInit {
  roles = signal<AdminRole[]>([]);
  errorMsg = signal('');
  showModal = signal(false);
  isEdit = signal(false);
  formRole = signal<Partial<AdminRole>>({});

  constructor(private roleService: RoleManagementService) {}

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.roleService.getRoles().subscribe({
      next: (data) => this.roles.set(data || []),
      error: () => this.errorMsg.set('Không thể tải danh sách Role.')
    });
  }

  openCreateModal(): void {
    this.isEdit.set(false);
    this.formRole.set({ code: '', name: '', description: '' });
    this.showModal.set(true);
  }

  openEditModal(role: AdminRole): void {
    this.isEdit.set(true);
    this.formRole.set({ ...role });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveRole(): void {
    const roleData = this.formRole();
    if (this.isEdit()) {
      this.roleService.updateRole(roleData.id!, roleData).subscribe({
        next: () => {
          this.loadRoles();
          this.closeModal();
        },
        error: () => this.errorMsg.set('Lỗi khi cập nhật Role.')
      });
    } else {
      this.roleService.createRole(roleData).subscribe({
        next: () => {
          this.loadRoles();
          this.closeModal();
        },
        error: () => this.errorMsg.set('Lỗi khi thêm Role mới.')
      });
    }
  }

  toggleActive(role: AdminRole): void {
    this.roleService.toggleRoleActive(role.id).subscribe({
      next: () => this.loadRoles(),
      error: () => this.errorMsg.set('Lỗi khi thay đổi trạng thái Role.')
    });
  }
}
