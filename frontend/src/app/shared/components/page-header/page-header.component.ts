import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Shared Page Header Component — tiêu đề trang chuẩn.
 *
 * Dumb component: chỉ layout subtitle + title + description + action buttons slot.
 * Thay thế inline page header markup lặp lại trong UserList, Dashboard, v.v.
 *
 * @example
 * <app-page-header
 *   subtitle="User Management"
 *   title="Quản lý người dùng"
 *   description="Quản trị tài khoản, role và trạng thái."
 * >
 *   <div actions>
 *     <app-button variant="secondary" icon="refresh">Tải lại</app-button>
 *     <app-button icon="plus">Tạo mới</app-button>
 *   </div>
 * </app-page-header>
 *
 * @see Design System section 3.1 — Type Scale (Page Title h1)
 * @see SHARED-COMPONENTS-STRATEGY.md — Molecule component
 */
@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        @if (subtitle) {
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {{ subtitle }}
          </p>
        }
        <h1 class="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          {{ title }}
        </h1>
        @if (description) {
          <p class="mt-2 max-w-2xl text-sm text-slate-600">
            {{ description }}
          </p>
        }
      </div>

      <!-- Action buttons slot -->
      <div class="flex flex-wrap gap-3 shrink-0">
        <ng-content select="[actions]" />
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `],
})
export class PageHeaderComponent {
  /** Overline text (nhỏ, uppercase) */
  @Input() subtitle = '';

  /** Tiêu đề trang chính (h1) */
  @Input({ required: true }) title!: string;

  /** Mô tả ngắn */
  @Input() description = '';
}
