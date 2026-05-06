import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpinnerComponent } from '../spinner/spinner.component';
import { IconComponent } from '../icon/icon.component';

/**
 * Button variant type definitions.
 * Theo Design System section 5.3 — Buttons.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Shared Button Component — nút bấm chuẩn cho toàn bộ dự án.
 *
 * Dumb component: chỉ hiển thị và emit sự kiện click.
 * Feature components PHẢI dùng <app-button> thay vì <button> HTML thuần.
 *
 * @example
 * <app-button>Đăng nhập</app-button>
 * <app-button variant="secondary" icon="refresh">Tải lại</app-button>
 * <app-button variant="danger" size="sm">Xóa</app-button>
 * <app-button [loading]="true" [disabled]="true">Đang xử lý...</app-button>
 * <app-button variant="primary" [fullWidth]="true" type="submit">Gửi</app-button>
 *
 * @see Design System section 5.3 — Buttons
 * @see SHARED-COMPONENTS-STRATEGY.md — Atom component
 */
@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, SpinnerComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      [class]="buttonClasses"
      [attr.aria-busy]="loading ? 'true' : null"
      [attr.aria-disabled]="disabled || loading ? 'true' : null"
    >
      @if (loading) {
        <app-spinner [size]="size === 'sm' ? 'sm' : 'sm'" />
      } @else if (icon) {
        <app-icon [name]="icon" [size]="size === 'sm' ? 'xs' : 'sm'" />
      }
      <ng-content />
    </button>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
    :host(.block) {
      display: block;
    }
  `],
})
export class ButtonComponent {
  /** Kiểu dáng nút — primary (CTA xanh), secondary (viền), danger (đỏ), ghost (transparent) */
  @Input() variant: ButtonVariant = 'primary';

  /** Kích thước nút */
  @Input() size: ButtonSize = 'md';

  /** Type attribute cho <button> */
  @Input() type: 'button' | 'submit' | 'reset' = 'button';

  /** Hiển thị spinner thay vì icon */
  @Input() loading = false;

  /** Vô hiệu hóa nút */
  @Input() disabled = false;

  /** Full width (100%) */
  @Input() fullWidth = false;

  /** Icon name (hiện bên trái text) */
  @Input() icon?: string;

  /** Build CSS classes dựa trên variant/size/state */
  get buttonClasses(): string {
    const base = [
      'inline-flex items-center justify-center gap-2',
      'font-medium',
      'transition-colors duration-200',
      'cursor-pointer',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
    ];

    // Size
    const sizeClasses: Record<ButtonSize, string> = {
      sm: 'px-3 py-1.5 text-xs rounded-lg',
      md: 'px-4 py-2 text-sm rounded-lg',
      lg: 'px-5 py-2.5 text-sm rounded-lg',
    };
    base.push(sizeClasses[this.size]);

    // Width
    if (this.fullWidth) {
      base.push('w-full');
    }

    // Variant
    const variantClasses: Record<ButtonVariant, string> = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-slate-400',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-400',
    };
    base.push(variantClasses[this.variant]);

    // Disabled state
    if (this.disabled || this.loading) {
      base.push('disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none');
    }

    return base.join(' ');
  }
}
