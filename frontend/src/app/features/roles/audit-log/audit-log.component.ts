import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleManagementService } from '@core/services/role-management.service';
import { AdminAuditLog } from '@core/models/role.models';
import { ToastService } from '@shared/components/toast/toast.service';
import { 
  PageHeaderComponent, CardComponent, SkeletonComponent, 
  EmptyStateComponent, BadgeComponent, ButtonComponent, PaginationComponent,
  BadgeVariant
} from '@shared/components';
import { DatetimePickerComponent } from '@shared/components/datetime-picker/datetime-picker.component';
import { AuditDetailModalComponent } from './audit-detail-modal.component';

/**
 * Audit Log Component — Nhật ký phân quyền
 * 
 * Features:
 *  - Danh sách paginated audit logs
 *  - Bộ lọc theo hành động (action)
 *  - Bộ lọc theo khoảng thời gian (date range)
 *  - Chi tiết modal cho từng log
 * 
 * Refactoring notes:
 *  - Từ static list → paginated + filterable
 *  - Detail view via modal (không hiển thị lộn xộn)
 *  - Clear separation: filter logic vs display logic
 */
@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    PageHeaderComponent, CardComponent, SkeletonComponent, 
    EmptyStateComponent, BadgeComponent, ButtonComponent, PaginationComponent,
    DatetimePickerComponent, AuditDetailModalComponent
  ],
  template: `
    <div class="flex flex-col gap-6">
      <app-page-header 
        title="Nhật ký Phân quyền" 
        subtitle="Audit Log"
        description="Lịch sử thay đổi Role và Permission trong hệ thống"
      />

      <!-- Filters -->
      <app-card class="space-y-4">
        <div class="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto]">
          <!-- Filter: Action -->
          <div>
            <label for="actionFilter" class="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Hành động
            </label>
            <select
              id="actionFilter"
              [value]="selectedAction()"
              (change)="onActionChange($event)"
              class="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
            >
              <option value="">Tất cả hành động</option>
              <option value="USER_ROLE_ASSIGNED">Thêm Role</option>
              <option value="USER_ROLE_REMOVED">Xóa Role</option>
              <option value="ROLE_PERMISSION_ASSIGNED">Thêm Permission</option>
              <option value="ROLE_PERMISSION_REMOVED">Xóa Permission</option>
              <option value="ROLE_CREATED">Tạo Role</option>
              <option value="ROLE_UPDATED">Cập nhật Role</option>
              <option value="ROLE_ACTIVATED">Kích hoạt Role</option>
              <option value="ROLE_DEACTIVATED">Vô hiệu hóa Role</option>
              <option value="ROLE_PERMISSIONS_UPDATED">Cập nhật Quyền</option>
            </select>
          </div>

          <!-- Filter: From Date -->
          <div>
            <app-datetime-picker
              label="Từ ngày"
              [value]="fromDate()"
              (dateChange)="fromDate.set($event); applyFilters()"
            />
          </div>

          <!-- Filter: To Date -->
          <div>
            <app-datetime-picker
              label="Tới ngày"
              [value]="toDate()"
              (dateChange)="toDate.set($event); applyFilters()"
            />
          </div>

          <!-- Reset button -->
          <div class="flex items-end">
            <app-button
              variant="secondary"
              size="sm"
              (click)="resetFilters()"
              class="w-full"
            >
              Xóa bộ lọc
            </app-button>
          </div>
        </div>
      </app-card>

      <!-- Logs Table -->
      <app-card padding="none">
        @if (loading()) {
          <app-skeleton variant="table-row" [rows]="5" [cols]="4" />
        } @else if (paginatedLogs().length === 0) {
          <div class="p-8 text-center border-t border-slate-100">
            <app-empty-state 
              icon="clock" 
              title="Chưa có nhật ký nào" 
              message="Không có nhật ký phù hợp với bộ lọc được chọn." 
            />
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse min-w-full divide-y divide-slate-200">
              <thead class="bg-slate-50">
                <tr>
                  <th class="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Thời gian</th>
                  <th class="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Người thực hiện</th>
                  <th class="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Hành động</th>
                  <th class="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Đối tượng</th>
                  <th class="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Hành động</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 bg-white">
                @for (log of paginatedLogs(); track log.id) {
                  <tr class="hover:bg-slate-50/50 transition-colors">
                    <td class="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                      {{ log.timestamp | date:'dd/MM/yyyy HH:mm:ss' }}
                    </td>
                    <td class="px-6 py-4 text-sm font-medium text-slate-900">
                      {{ log.actor }}
                    </td>
                    <td class="px-6 py-4">
                      <app-badge [variant]="getActionBadgeVariant(log.action)">
                        {{ formatAction(log.action) }}
                      </app-badge>
                    </td>
                    <td class="px-6 py-4 text-sm text-slate-600">
                      <span class="font-medium text-slate-900">{{ log.resource }}</span>
                    </td>
                    <td class="px-6 py-4 text-right">
                      <app-button
                        variant="secondary"
                        size="sm"
                        (click)="openDetail(log)"
                      >
                        Chi tiết
                      </app-button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <app-pagination
            [total]="filteredLogs().length"
            [pageSize]="pageSize"
            [currentPage]="currentPage()"
            (pageChange)="currentPage.set($event)"
          />
        }
      </app-card>
    </div>

    <!-- Detail Modal -->
    <app-audit-detail-modal
      modalBody
      [open]="showDetailModal()"
      [log]="selectedLog()"
      (closed)="showDetailModal.set(false)"
    />
  `,
})
export class AuditLogComponent implements OnInit {
  // ========== STATE ==========
  allLogs = signal<AdminAuditLog[]>([]);
  loading = signal(true);
  
  // ========== FILTERS ==========
  selectedAction = signal('');
  fromDate = signal<Date | null>(null);
  toDate = signal<Date | null>(null);

  // ========== PAGINATION ==========
  pageSize = 10;
  currentPage = signal(1);

  // ========== DETAIL MODAL ==========
  showDetailModal = signal(false);
  selectedLog = signal<AdminAuditLog | null>(null);

  // ========== COMPUTED ==========
  filteredLogs = computed(() => {
    let logs = [...this.allLogs()];

    // Filter by action
    const action = this.selectedAction();
    if (action) {
      logs = logs.filter(log => log.action === action);
    }

    // Filter by date range
    const from = this.fromDate();
    const to = this.toDate();
    if (from || to) {
      logs = logs.filter(log => {
        const logDate = new Date(log.timestamp);
        if (from && logDate < from) return false;
        if (to && logDate > to) return false;
        return true;
      });
    }

    return logs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  });

  paginatedLogs = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredLogs().slice(start, start + this.pageSize);
  });

  // ========== DEPENDENCIES ==========
  private roleService = inject(RoleManagementService);
  private toastService = inject(ToastService);

  ngOnInit(): void {
    this.loadAuditLogs();
  }

  // ========== LOADING ==========
  loadAuditLogs(): void {
    this.loading.set(true);
    this.roleService.getAuditLogs().subscribe({
      next: (data) => {
        this.allLogs.set(data || []);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.error('Không thể tải nhật ký phân quyền.');
        this.loading.set(false);
      }
    });
  }

  // ========== FILTERS ==========
  applyFilters(): void {
    // Reset to first page when filters change
    this.currentPage.set(1);
  }

  onActionChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedAction.set(value);
  }

  resetFilters(): void {
    this.selectedAction.set('');
    this.fromDate.set(null);
    this.toDate.set(null);
    this.currentPage.set(1);
  }

  // ========== DETAIL ==========
  openDetail(log: AdminAuditLog): void {
    this.selectedLog.set(log);
    this.showDetailModal.set(true);
  }

  // ========== HELPERS ==========
  formatAction(action: string): string {
    const actions: Record<string, string> = {
      'USER_ROLE_ASSIGNED': 'Thêm Role',
      'USER_ROLE_REMOVED': 'Xóa Role',
      'ROLE_PERMISSION_ASSIGNED': 'Thêm Permission',
      'ROLE_PERMISSION_REMOVED': 'Xóa Permission',
      'ROLE_CREATED': 'Tạo Role',
      'ROLE_UPDATED': 'Cập nhật Role',
      'ROLE_ACTIVATED': 'Kích hoạt Role',
      'ROLE_DEACTIVATED': 'Vô hiệu hóa Role',
      'ROLE_PERMISSIONS_UPDATED': 'Cập nhật Quyền',
    };
    return actions[action] || action;
  }

  getActionBadgeVariant(action: string): BadgeVariant {
    if (action.includes('ASSIGNED') || action.includes('CREATED') || action.includes('ACTIVATED')) {
      return 'success';
    }
    if (action.includes('REMOVED') || action.includes('DEACTIVATED')) {
      return 'error';
    }
    return 'info';
  }
}
