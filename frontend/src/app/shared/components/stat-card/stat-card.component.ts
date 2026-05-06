import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Shared Stat Card Component — hiển thị KPI / metric đơn.
 *
 * Dumb component: chỉ hiển thị label, value, description.
 * Thay thế inline stat card markup lặp lại trong Dashboard & UserList.
 *
 * @example
 * <app-stat-card label="Tổng yêu cầu" [value]="totalRequests()" />
 * <app-stat-card
 *   label="Chờ duyệt"
 *   [value]="pendingCount()"
 *   accentColor="border-l-amber-500"
 *   valueColor="text-amber-600"
 * />
 * <app-stat-card
 *   label="Đang hoạt động"
 *   [value]="activeCount()"
 *   description="Người dùng có thể đăng nhập"
 *   valueColor="text-emerald-600"
 * />
 *
 * @see Design System section 7 — KPI single value (Stat Card)
 * @see SHARED-COMPONENTS-STRATEGY.md — Molecule component
 */
@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="bg-white rounded-xl border border-slate-200 shadow-sm p-5
             transition-all hover:shadow-md"
      [ngClass]="accentColor ? accentColor + ' border-l-4' : ''"
    >
      <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
        {{ label }}
      </p>
      <p class="text-2xl font-bold" [ngClass]="valueColor">
        {{ value }}
      </p>
      @if (description) {
        <p class="mt-2 text-sm text-slate-500">{{ description }}</p>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `],
})
export class StatCardComponent {
  /** Label text (phía trên value) */
  @Input({ required: true }) label!: string;

  /** Giá trị KPI */
  @Input({ required: true }) value!: string | number;

  /** Mô tả phụ (dưới value) */
  @Input() description = '';

  /** CSS class cho border-left color (ví dụ: 'border-l-amber-500') */
  @Input() accentColor = '';

  /** CSS class cho value color (ví dụ: 'text-amber-600') */
  @Input() valueColor = 'text-slate-900';
}
