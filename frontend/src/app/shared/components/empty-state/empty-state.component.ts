import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

/**
 * Shared Empty State Component — hiển thị khi không có dữ liệu.
 *
 * Dumb component: chỉ hiển thị icon + title + message + optional action.
 * Thay thế inline empty state markup (@empty) trong UserList, Dashboard table.
 *
 * @example
 * <app-empty-state
 *   title="Không tìm thấy người dùng phù hợp"
 *   message="Thử thay đổi bộ lọc hoặc tạo người dùng mới."
 * />
 *
 * <!-- Với action button -->
 * <app-empty-state icon="file-text" title="Chưa có yêu cầu nào">
 *   <app-button variant="primary" icon="plus">Tạo yêu cầu mới</app-button>
 * </app-empty-state>
 *
 * @see Design System section 5.6 — Data Tables (Empty state)
 * @see SHARED-COMPONENTS-STRATEGY.md — Organism component
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center justify-center py-16 text-center">
      <div class="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <app-icon [name]="icon" size="lg" class="text-slate-400" />
      </div>
      <p class="text-sm font-semibold text-slate-900">
        {{ title }}
      </p>
      @if (message) {
        <p class="mt-2 text-sm text-slate-500 max-w-sm">
          {{ message }}
        </p>
      }
      <!-- Optional action slot -->
      <div class="mt-4">
        <ng-content />
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `],
})
export class EmptyStateComponent {
  /** Tên icon (Lucide) */
  @Input() icon = 'inbox';

  /** Tiêu đề chính */
  @Input() title = 'Không có dữ liệu';

  /** Mô tả phụ */
  @Input() message = '';
}
