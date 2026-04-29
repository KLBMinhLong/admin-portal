import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoleManagementService } from '@core/services/role-management.service';
import { AdminAuditLog } from '@core/models/role.models';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-slate-900">Nhật ký Phân quyền</h1>
      <p class="text-sm text-slate-500 mt-1">Lịch sử thay đổi Role và Permission trong hệ thống</p>
    </div>

    @if (errorMsg()) {
      <div class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
        {{ errorMsg() }}
      </div>
    }

    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      @if (loading()) {
        <div class="p-8 space-y-4">
          @for (i of [1,2,3,4,5]; track i) {
            <div class="skeleton h-12 w-full"></div>
          }
        </div>
      } @else if (logs().length === 0) {
        <div class="p-12 text-center">
          <svg class="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p class="text-sm font-medium text-slate-900">Chưa có nhật ký nào</p>
        </div>
      } @else {
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200">
                <th class="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Thời gian</th>
                <th class="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Người thực hiện</th>
                <th class="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Hành động</th>
                <th class="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              @for (log of logs(); track log.id) {
                <tr class="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td class="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                    {{ log.createdAt | date:'dd/MM/yyyy HH:mm:ss' }}
                  </td>
                  <td class="px-6 py-4 text-sm font-medium text-slate-900">
                    {{ log.actorUsername }}
                  </td>
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                      {{ log.action }}
                    </span>
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
    </div>
  `,
})
export class AuditLogComponent implements OnInit {
  logs = signal<AdminAuditLog[]>([]);
  loading = signal(true);
  errorMsg = signal('');

  constructor(private roleService: RoleManagementService) {}

  ngOnInit(): void {
    this.roleService.getAuditLogs().subscribe({
      next: (data) => {
        this.logs.set(data || []);
        this.loading.set(false);
      },
      error: () => {
        this.errorMsg.set('Không thể tải nhật ký phân quyền.');
        this.loading.set(false);
      }
    });
  }
}
