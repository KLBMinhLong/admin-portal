import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ICON_REGISTRY } from './icon-registry';

/**
 * Shared Icon Component — wrapper cho Lucide-style SVG icons.
 *
 * Dumb component: chỉ nhận tên icon và render SVG tương ứng.
 * Tất cả feature components phải dùng <app-icon> thay vì inline SVG.
 *
 * @example
 * <app-icon name="dashboard" />
 * <app-icon name="check-circle" size="lg" />
 * <app-icon name="search" size="sm" class="text-slate-400" />
 *
 * @see Design System section 9 — Icon System
 * @see SHARED-COMPONENTS-STRATEGY.md — Atom component
 */
@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (paths.length > 0) {
      <svg
        [attr.width]="sizeMap[size]"
        [attr.height]="sizeMap[size]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        [attr.aria-label]="ariaLabel || name"
        [attr.aria-hidden]="ariaLabel ? null : 'true'"
        class="inline-block shrink-0"
      >
        @for (path of paths; track $index) {
          <path [attr.d]="path" />
        }
      </svg>
    }
  `,
})
export class IconComponent {
  /** Tên icon (key trong ICON_REGISTRY) */
  @Input({ required: true }) name!: string;

  /** Kích thước icon */
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' = 'md';

  /** Aria label cho accessibility — nếu không set, icon sẽ aria-hidden */
  @Input() ariaLabel?: string;

  /** Map size → pixel value (Design System: default 20px) */
  readonly sizeMap: Record<string, number> = {
    xs: 16,
    sm: 18,
    md: 20,
    lg: 24,
  };

  /** Lấy SVG paths từ registry */
  get paths(): string[] {
    return ICON_REGISTRY[this.name] || [];
  }
}
