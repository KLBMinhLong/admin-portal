import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../modal/modal.component';
import { ButtonComponent } from '../button/button.component';
import { IconComponent } from '../icon/icon.component';

/**
 * Confirm dialog variant type.
 */
export type ConfirmVariant = 'danger' | 'warning' | 'info';

/**
 * Shared Confirm Dialog Component — xác nhận hành động trước khi thực hiện.
 *
 * Dumb component: dùng app-modal bên trong, thêm icon + confirm/cancel buttons.
 * Dùng cho confirm delete, toggle active, v.v.
 *
 * @example
 * <app-confirm-dialog
 *   [open]="showConfirm()"
 *   title="Khóa tài khoản"
 *   message="Bạn có chắc muốn khóa tài khoản này?"
 *   confirmText="Khóa"
 *   variant="danger"
 *   [loading]="processing()"
 *   (confirmed)="doLock()"
 *   (cancelled)="showConfirm.set(false)"
 * />
 *
 * @see SHARED-COMPONENTS-STRATEGY.md — Organism component
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, ModalComponent, ButtonComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal
      [open]="open"
      [closable]="!loading"
      size="sm"
      (closed)="onCancel()"
    >
      <div modalBody class="px-6 py-6">
        <div class="flex flex-col items-center text-center">
          <!-- Icon -->
          <div
            class="w-12 h-12 rounded-full flex items-center justify-center mb-4"
            [ngClass]="iconBgClass"
          >
            <app-icon [name]="iconName" size="lg" [class]="iconColorClass" />
          </div>

          <!-- Title -->
          <h3 class="text-lg font-semibold text-slate-900">{{ title }}</h3>

          <!-- Message -->
          @if (message) {
            <p class="mt-2 text-sm text-slate-500 max-w-sm">{{ message }}</p>
          }
        </div>
      </div>

      <div modalFooter class="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
        <app-button
          variant="secondary"
          [disabled]="loading"
          (click)="onCancel()"
        >
          {{ cancelText }}
        </app-button>
        <app-button
          [variant]="variant === 'danger' ? 'danger' : 'primary'"
          [loading]="loading"
          (click)="onConfirm()"
        >
          {{ confirmText }}
        </app-button>
      </div>
    </app-modal>
  `,
})
export class ConfirmDialogComponent {
  /** Mở/đóng dialog */
  @Input() open = false;

  /** Tiêu đề */
  @Input() title = 'Xác nhận';

  /** Nội dung message */
  @Input() message = '';

  /** Text nút xác nhận */
  @Input() confirmText = 'Xác nhận';

  /** Text nút hủy */
  @Input() cancelText = 'Hủy';

  /** Kiểu dáng (ảnh hưởng icon và button color) */
  @Input() variant: ConfirmVariant = 'warning';

  /** Loading state cho nút confirm */
  @Input() loading = false;

  /** Emit khi user confirm */
  @Output() confirmed = new EventEmitter<void>();

  /** Emit khi user cancel hoặc đóng */
  @Output() cancelled = new EventEmitter<void>();

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    if (!this.loading) {
      this.cancelled.emit();
    }
  }

  /** Icon name theo variant */
  get iconName(): string {
    const map: Record<ConfirmVariant, string> = {
      danger: 'alert-triangle',
      warning: 'alert-triangle',
      info: 'info',
    };
    return map[this.variant];
  }

  /** CSS class cho icon background */
  get iconBgClass(): string {
    const map: Record<ConfirmVariant, string> = {
      danger: 'bg-red-50',
      warning: 'bg-amber-50',
      info: 'bg-blue-50',
    };
    return map[this.variant];
  }

  /** CSS class cho icon color */
  get iconColorClass(): string {
    const map: Record<ConfirmVariant, string> = {
      danger: 'text-red-500',
      warning: 'text-amber-500',
      info: 'text-blue-500',
    };
    return map[this.variant];
  }
}
