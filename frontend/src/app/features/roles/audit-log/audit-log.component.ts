import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoleManagementService } from '@core/services/role-management.service';
import { AdminAuditLog } from '@core/models/role.models';
import { ToastService } from '@shared/components/toast/toast.service';
import { 
  PageHeaderComponent, CardComponent, SkeletonComponent, 
  EmptyStateComponent, BadgeComponent 
} from '@shared/components';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [
    CommonModule, 
    PageHeaderComponent, CardComponent, SkeletonComponent, 
    EmptyStateComponent, BadgeComponent
  ],
  template: `
    <div class="flex flex-col gap-6">
      <app-page-header 
        title="Nhật ký Phân quyền" 
        description="Lịch sử thay đổi Role và Permission trong hệ thống"
      />

      <app-card padding="none">
        @if (loading()) {
          <app-skeleton variant="table-row" [rows]="5" [cols]="4" />
        } @else if (logs().length === 0) {
          <div class="p-8 text-center border-t border-slate-100">
            <app-empty-state 
              icon="clock" 
              title="Chưa có nhật ký nào" 
              message="Hệ thống chưa ghi nhận thay đổi phân quyền nào." 
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
                  <th class="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Chi tiết</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 bg-white">
                @for (log of logs(); track log.id) {
                  <tr class="hover:bg-slate-50/50 transition-colors">
                    <td class="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                      {{ log.createdAt | date:'dd/MM/yyyy HH:mm:ss' }}
                    </td>
                    <td class="px-6 py-4 text-sm font-medium text-slate-900">
                      {{ log.actorUsername }}
                    </td>
                    <td class="px-6 py-4">
                      <app-badge variant="default">
                        {{ log.action }}
                      </app-badge>
                    </td>
                    <td class="px-6 py-4 text-sm text-slate-600">
                      <span class="font-medium text-slate-900">{{ log.targetType }}</span> ({{ log.targetId }})
                      <div class="text-xs text-slate-500 mt-1 whitespace-pre-wrap">{{ log.details }}</div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </app-card>
    </div>
  `,
})
export class AuditLogComponent implements OnInit {
  logs = signal<AdminAuditLog[]>([]);
  loading = signal(true);

  private roleService = inject(RoleManagementService);
  private toastService = inject(ToastService);

  ngOnInit(): void {
    this.roleService.getAuditLogs().subscribe({
      next: (data) => {
        this.logs.set(data || []);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.error('Lỗi', 'Không thể tải nhật ký phân quyền.');
        this.loading.set(false);
      }
    });
  }
}
