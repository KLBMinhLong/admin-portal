import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

/**
 * Alert variant type.
 * Theo Design System section 2.2 — Semantic Colors.
 */
export type AlertVariant = 'success' | 'error' | 'warning' | 'info';

/**
 * Shared Alert Component — thông báo inline (error, success, warning, info).
 *
 * Dumb component: chỉ hiển thị message, có thể dismiss.
 * Thay thế tất cả inline error/success div đang lặp lại trong features.
 *
 * @example
 * <app-alert variant="error">Sai tên đăng nhập hoặc mật khẩu</app-alert>
 * <app-alert variant="success" [dismissible]="true" (dismissed)="clearMsg()">Tạo thành công!</app-alert>
 * <app-alert variant="warning">Quá nhiều lần thử</app-alert>
 *
 * @see Design System section 5.8 — Toast / Notification (style tương tự)
 * @see SHARED-COMPONENTS-STRATEGY.md — Molecule component
 */
@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex items-start gap-2 p-3 rounded-lg border text-sm"
      [ngClass]="variantClasses"
      role="alert"
    >
      <app-icon
        [name]="iconName"
        size="sm"
        class="shrink-0 mt-0.5"
      />
      <div class="flex-1 min-w-0">
        <ng-content />
      </div>
      @if (dismissible) {
        <button
          type="button"
          (click)="dismissed.emit()"
          class="shrink-0 p-0.5 rounded hover:bg-black/5 transition-colors cursor-pointer"
          aria-label="Đóng thông báo"
        >
          <app-icon name="x" size="xs" />
        </button>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `],
})
export class AlertComponent {
  /** Kiểu alert */
  @Input() variant: AlertVariant = 'info';

  /** Cho phép dismiss */
  @Input() dismissible = false;

  /** Emit khi user dismiss */
  @Output() dismissed = new EventEmitter<void>();

  /** CSS classes theo variant */
  get variantClasses(): string {
    const map: Record<AlertVariant, string> = {
      success: 'bg-green-50 border-green-200 text-green-700',
      error: 'bg-red-50 border-red-200 text-red-700',
      warning: 'bg-amber-50 border-amber-200 text-amber-700',
      info: 'bg-blue-50 border-blue-200 text-blue-700',
    };
    return map[this.variant];
  }

  /** Icon name theo variant */
  get iconName(): string {
    const map: Record<AlertVariant, string> = {
      success: 'check-circle',
      error: 'exclamation-circle',
      warning: 'alert-triangle',
      info: 'info',
    };
    return map[this.variant];
  }
}
