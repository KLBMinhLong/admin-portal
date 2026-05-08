import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminAuditLog } from '@core/models/role.models';
import { ModalComponent, BadgeComponent, ButtonComponent, BadgeVariant } from '@shared/components';

@Component({
  selector: 'app-audit-detail-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, ButtonComponent, BadgeComponent],
  template: `
  <app-modal
    [open]="open"
    title="Chi tiết Nhật ký Phân quyền"
    subtitle="Audit Log Detail"
    description="Xem thông tin chi tiết về hành động được thực hiện"
    size="lg"
    (closed)="onClose()"
  >
    <div modalBody>
      <ng-container *ngIf="log">
        <div class="space-y-6">
          <!-- Thời gian & Người thực hiện -->
          <div class="grid grid-cols-2 gap-4">
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Thời gian</p>
              <p class="mt-2 text-sm font-medium text-slate-900">
                {{ log.timestamp | date:'dd/MM/yyyy HH:mm:ss' }}
              </p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Người thực hiện</p>
              <p class="mt-2 text-sm font-medium text-slate-900">{{ log.actor }}</p>
            </div>
          </div>

          <!-- Hành động -->
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Hành động</p>
            <div class="mt-2 flex items-center gap-2">
              <app-badge [variant]="getActionBadgeVariant(log.action)">
                {{ formatAction(log.action) }}
              </app-badge>
            </div>
          </div>

          <!-- Đối tượng -->
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Đối tượng tác động (Resource)</p>
            <p class="mt-2 text-sm font-medium text-slate-900">{{ log.resource }}</p>
          </div>

          <!-- Chi tiết -->
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 mb-3">Chi tiết hành động</p>
            <div class="bg-white rounded-lg border border-slate-200 p-4 font-mono text-xs text-slate-600 whitespace-pre-wrap overflow-auto max-h-[300px] leading-relaxed">
              {{ formatDetails(log.details) }}
            </div>
          </div>
        </div>
      </ng-container>
    </div>
    <ng-container modalFooter>
      <div class="flex justify-end gap-3">
        <app-button
          type="button"
          variant="secondary"
          (click)="onClose()"
        >
          Đóng
        </app-button>
      </div>
    </ng-container>
  </app-modal>
`,
})
export class AuditDetailModalComponent {
  @Input() open = false;
  @Input() log: AdminAuditLog | null = null;
  @Output() closed = new EventEmitter<void>();

  onClose(): void {
    this.closed.emit();
  }

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

  formatDetails(details: any): string {
    if (details === null || details === undefined) {
      return '';
    }

    // If it's an object/array, pretty-print JSON
    if (typeof details === 'object') {
      try {
        return JSON.stringify(details, null, 2);
      } catch {
        return String(details);
      }
    }

    // Ensure it's a string from here
    const txt = String(details);

    // Try to format as key=value pairs separated by commas
    if (txt.includes('=') && !txt.includes('{')) {
      return txt
        .split(',')
        .map(pair => pair.trim())
        .join('\n');
    }

    return txt;
  }
}
