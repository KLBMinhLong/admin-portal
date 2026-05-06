import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleManagementService } from '@core/services/role-management.service';
import { AdminRole, AdminPermission } from '@core/models/role.models';
import { ToastService } from '@shared/components/toast/toast.service';
import { 
  PageHeaderComponent, CardComponent, ButtonComponent 
} from '@shared/components';

@Component({
  selector: 'app-role-matrix',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    PageHeaderComponent, CardComponent, ButtonComponent
  ],
  template: `
    <div class="flex flex-col gap-6">
      <app-page-header title="Ma trận Phân quyền">
        <div actions class="flex gap-3">
          <app-button variant="secondary" icon="refresh" [disabled]="loading()" (onClick)="loadData()">
            Tải lại
          </app-button>
          <app-button variant="primary" icon="check-circle" [disabled]="loading() || !hasChanges()" (onClick)="saveAllChanges()">
            Lưu thay đổi
          </app-button>
        </div>
      </app-page-header>

      @if (loading()) {
        <app-card>
          <div class="animate-pulse space-y-4">
            <div class="h-10 bg-slate-200 rounded w-full"></div>
            <div class="h-10 bg-slate-200 rounded w-full"></div>
            <div class="h-10 bg-slate-200 rounded w-full"></div>
          </div>
        </app-card>
      } @else {
        <app-card padding="none">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse min-w-full">
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
                      <div class="text-xs text-slate-500 mt-0.5">{{ perm.code }}</div>
                    </td>
                    @for (role of roles(); track role.id) {
                      <td class="border-b border-slate-100 px-4 py-3 text-center">
                        <label class="inline-flex items-center cursor-pointer p-1">
                          <input type="checkbox"
                            [checked]="hasPermission(role.id, perm.code)"
                            (change)="togglePermission(role.id, perm.code)"
                            class="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer transition-colors" />
                        </label>
                      </td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </app-card>
      }
    </div>
  `,
})
export class RoleMatrixComponent implements OnInit {
  roles = signal<AdminRole[]>([]);
  permissions = signal<AdminPermission[]>([]);
  loading = signal(true);

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

  private roleService = inject(RoleManagementService);
  private toastService = inject(ToastService);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);

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
    }).catch(() => {
      this.toastService.error('Lỗi', 'Lỗi khi tải dữ liệu. Vui lòng thử lại.');
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
      this.toastService.success('Thành công', 'Lưu phân quyền thành công.');
      this.loadData();
    }).catch(() => {
      this.toastService.error('Lỗi', 'Lỗi khi lưu phân quyền. Vui lòng thử lại.');
      this.loading.set(false);
    });
  }
}
