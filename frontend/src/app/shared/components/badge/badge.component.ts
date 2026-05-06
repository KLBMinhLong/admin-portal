import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Badge variant type.
 * Mapping theo Design System section 2.2 — Semantic Colors.
 */
export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';
export type BadgeSize = 'sm' | 'md';

/**
 * Shared Badge Component — nhãn trạng thái/phân loại.
 *
 * Dumb component: chỉ hiển thị text với style theo variant.
 * Dùng cho status labels, tags, category markers.
 *
 * @example
 * <app-badge variant="success">Hoạt động</app-badge>
 * <app-badge variant="warning" size="sm">Chờ duyệt</app-badge>
 * <app-badge variant="error" [dot]="true">Từ chối</app-badge>
 * <app-badge variant="neutral">Draft</app-badge>
 *
 * @see Design System section 5.7 — Badges / Status Chips
 * @see SHARED-COMPONENTS-STRATEGY.md — Atom component
 */
@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex items-center rounded-full font-medium"
      [ngClass]="[variantClasses, sizeClasses]"
    >
      @if (dot) {
        <span
          class="shrink-0 rounded-full"
          [ngClass]="[dotClasses, dotSizeClasses]"
        ></span>
      }
      <ng-content />
    </span>
  `,
})
export class BadgeComponent {
  /** Kiểu dáng badge theo semantic color */
  @Input() variant: BadgeVariant = 'neutral';

  /** Kích thước badge */
  @Input() size: BadgeSize = 'md';

  /** Hiển thị dot indicator bên trái */
  @Input() dot = false;

  /** CSS classes cho variant */
  get variantClasses(): string {
    const map: Record<BadgeVariant, string> = {
      success: 'bg-green-50 text-green-700 border border-green-200',
      warning: 'bg-amber-50 text-amber-700 border border-amber-200',
      error: 'bg-red-50 text-red-700 border border-red-200',
      info: 'bg-blue-50 text-blue-700 border border-blue-200',
      neutral: 'bg-slate-100 text-slate-600 border border-slate-200',
    };
    return map[this.variant];
  }

  /** CSS classes cho size */
  get sizeClasses(): string {
    const map: Record<BadgeSize, string> = {
      sm: 'px-2 py-0.5 text-[11px] gap-1',
      md: 'px-2.5 py-0.5 text-xs gap-1.5',
    };
    return map[this.size];
  }

  /** CSS classes cho dot color */
  get dotClasses(): string {
    const map: Record<BadgeVariant, string> = {
      success: 'bg-green-500',
      warning: 'bg-amber-500',
      error: 'bg-red-500',
      info: 'bg-blue-500',
      neutral: 'bg-slate-400',
    };
    return map[this.variant];
  }

  /** CSS classes cho dot size */
  get dotSizeClasses(): string {
    return this.size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';
  }
}
