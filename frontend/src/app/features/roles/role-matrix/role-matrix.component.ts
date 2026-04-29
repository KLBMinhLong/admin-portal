import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleManagementService } from '@core/services/role-management.service';
import { AdminRole, AdminPermission } from '@core/models/role.models';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-role-matrix',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <h1 class="text-2xl font-bold text-slate-900">Ma trận Phân quyền</h1>
      <div class="flex gap-3">
        <button (click)="loadData()" [disabled]="loading()"
          class="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium
                 rounded-lg transition-colors duration-200 cursor-pointer disabled:opacity-50">
          Tải lại
        </button>
        <button (click)="saveAllChanges()" [disabled]="loading() || !hasChanges()"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium
                 rounded-lg transition-colors duration-200 cursor-pointer disabled:opacity-50">
          Lưu thay đổi
        </button>
      </div>
    </div>

    @if (errorMsg()) {
      <div class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
        {{ errorMsg() }}
      </div>
    }
    @if (successMsg()) {
      <div class="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
        {{ successMsg() }}
      </div>
    }

    @if (loading()) {
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
        <div class="animate-pulse space-y-4">
          <div class="h-10 bg-slate-200 rounded w-full"></div>
          <div class="h-10 bg-slate-200 rounded w-full"></div>
          <div class="h-10 bg-slate-200 rounded w-full"></div>
        </div>
      </div>
    } @else {
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr>
                <th class="sticky left-0 z-20 bg-slate-100 border-b border-r border-slate-200 px-6 py-4 text-sm font-semibold text-slate-900 w-1/3">
                  Quyền hạn (Permissions)
                </th>
                @for (role of roles(); track role.id) {
                  <th class="bg-slate-50 border-b border-slate-200 px-4 py-4 text-center">
                    <div class="text-sm font-semibold text-slate-900">{{ role.name }}</div>
                    <div class="text-xs text-slate-500 font-normal mt-0.5">{{ role.code }}</div>
                  </th>
                }
              </tr>
            </thead>
            <tbody>
              @for (perm of permissions(); track perm.id) {
                <tr class="hover:bg-slate-50/50 transition-colors">
                  <td class="sticky left-0 z-10 bg-white group-hover:bg-slate-50 border-b border-r border-slate-200 px-6 py-3">
                    <div class="text-sm font-medium text-slate-900">{{ perm.name }}</div>
                    <div class="text-xs text-slate-500">{{ perm.code }}</div>
                  </td>
                  @for (role of roles(); track role.id) {
                    <td class="border-b border-slate-100 px-4 py-3 text-center">
                      <label class="inline-flex items-center cursor-pointer">
                        <input type="checkbox"
                          [checked]="hasPermission(role.id, perm.code)"
                          (change)="togglePermission(role.id, perm.code)"
                          class="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer" />
                      </label>
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }
  `,
})
export class RoleMatrixComponent implements OnInit {
  roles = signal<AdminRole[]>([]);
  permissions = signal<AdminPermission[]>([]);
  loading = signal(true);
  errorMsg = signal('');
  successMsg = signal('');

  // Trạng thái hiện tại đang edit trên UI: map[roleId] -> set of permissionCodes
  currentAssignments = signal<Map<string, Set<string>>>(new Map());
  // Trạng thái gốc để so sánh hasChanges
  originalAssignments = signal<Map<string, Set<string>>>(new Map());

  hasChanges = computed(() => {
    const current = this.currentAssignments();
    const original = this.originalAssignments();
    for (const [roleId, currentSet] of current.entries()) {
      const originalSet = original.get(roleId) || new Set();
      if (currentSet.size !== originalSet.size) return true;
      for (const code of currentSet) {
        if (!originalSet.has(code)) return true;
      }
    }
    return false;
  });

  constructor(private roleService: RoleManagementService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.errorMsg.set('');

    // Load roles and permissions simultaneously
    Promise.all([
      this.roleService.getRoles().toPromise(),
      this.roleService.getPermissions().toPromise()
    ]).then(([rolesData, permsData]) => {
      this.roles.set(rolesData || []);
      this.permissions.set(permsData || []);

      const originalMap = new Map<string, Set<string>>();
      const currentMap = new Map<string, Set<string>>();

      (rolesData || []).forEach(r => {
        originalMap.set(r.id, new Set(r.permissionCodes));
        currentMap.set(r.id, new Set(r.permissionCodes));
      });

      this.originalAssignments.set(originalMap);
      this.currentAssignments.set(currentMap);
      this.loading.set(false);
    }).catch(err => {
      this.errorMsg.set('Lỗi khi tải dữ liệu. Vui lòng thử lại.');
      this.loading.set(false);
    });
  }

  hasPermission(roleId: string, permCode: string): boolean {
    return this.currentAssignments().get(roleId)?.has(permCode) || false;
  }

  togglePermission(roleId: string, permCode: string): void {
    const map = new Map(this.currentAssignments());
    const set = new Set(map.get(roleId) || []);
    if (set.has(permCode)) {
      set.delete(permCode);
    } else {
      set.add(permCode);
    }
    map.set(roleId, set);
    this.currentAssignments.set(map);
  }

  saveAllChanges(): void {
    this.loading.set(true);
    this.errorMsg.set('');
    this.successMsg.set('');

    const current = this.currentAssignments();
    const original = this.originalAssignments();
    const promises: Promise<any>[] = [];

    for (const [roleId, currentSet] of current.entries()) {
      const originalSet = original.get(roleId) || new Set();
      let changed = currentSet.size !== originalSet.size;
      if (!changed) {
        for (const code of currentSet) {
          if (!originalSet.has(code)) { changed = true; break; }
        }
      }

      if (changed) {
        promises.push(
          this.roleService.assignPermissions(roleId, Array.from(currentSet)).toPromise()
        );
      }
    }

    Promise.all(promises).then(() => {
      this.successMsg.set('Lưu phân quyền thành công.');
      setTimeout(() => this.successMsg.set(''), 3000);
      // Reload to reset original state
      this.loadData();
    }).catch(err => {
      this.errorMsg.set('Lỗi khi lưu phân quyền. Vui lòng thử lại.');
      this.loading.set(false);
    });
  }
}
