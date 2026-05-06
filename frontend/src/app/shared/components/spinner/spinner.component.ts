import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Shared Spinner Component — loading indicator.
 *
 * Dumb component: chỉ hiển thị animation xoay tròn.
 * Được dùng bên trong app-button (loading state) và các vùng loading khác.
 *
 * @example
 * <app-spinner />
 * <app-spinner size="lg" />
 * <app-spinner size="sm" class="text-blue-600" />
 *
 * @see Design System section 6 — Skeleton pulse 2s
 * @see SHARED-COMPONENTS-STRATEGY.md — Atom component
 */
@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [class]="'animate-spin inline-block shrink-0 ' + sizeClass"
      fill="none"
      viewBox="0 0 24 24"
      [attr.aria-label]="'Đang tải'"
      role="status"
    >
      <circle
        class="opacity-25"
        cx="12" cy="12" r="10"
        stroke="currentColor"
        stroke-width="4"
      ></circle>
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      ></path>
    </svg>
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
  `],
})
export class SpinnerComponent {
  /** Kích thước spinner */
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  /** CSS class theo size */
  get sizeClass(): string {
    const map: Record<string, string> = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-8 h-8',
    };
    return map[this.size] || map['md'];
  }
}
