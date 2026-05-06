import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Skeleton variant type.
 */
export type SkeletonVariant = 'text' | 'circle' | 'rect' | 'table-row';

/**
 * Shared Skeleton Component — placeholder loading animation.
 *
 * Dumb component: hiển thị placeholder shimmer khi data đang tải.
 * Thay thế inline skeleton markup trong UserList.
 *
 * @example
 * <!-- Single text line -->
 * <app-skeleton />
 *
 * <!-- Circle avatar -->
 * <app-skeleton variant="circle" width="40px" height="40px" />
 *
 * <!-- Rectangle card -->
 * <app-skeleton variant="rect" height="120px" />
 *
 * <!-- Table rows -->
 * <app-skeleton variant="table-row" [rows]="6" [cols]="5" />
 *
 * @see Design System section 6 — Skeleton pulse 2s ease-in-out
 * @see SHARED-COMPONENTS-STRATEGY.md — Organism component
 */
@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (variant) {
      @case ('table-row') {
        <div class="space-y-0">
          @for (row of rowsArray; track row) {
            <div
              class="grid gap-4 border-b border-slate-100 px-6 py-4"
              [style.grid-template-columns]="'repeat(' + cols + ', 1fr)'"
            >
              @for (col of colsArray; track col) {
                <div class="skeleton h-10 w-full rounded-xl"></div>
              }
            </div>
          }
        </div>
      }
      @case ('circle') {
        <div
          class="skeleton rounded-full shrink-0"
          [style.width]="width"
          [style.height]="height || width"
        ></div>
      }
      @default {
        <div
          class="skeleton rounded-xl"
          [style.width]="width"
          [style.height]="variant === 'text' ? '1rem' : height"
        ></div>
      }
    }
  `,
  styles: [`
    :host {
      display: block;
    }

    .skeleton {
      background: linear-gradient(
        90deg,
        #f1f5f9 25%,
        #e2e8f0 50%,
        #f1f5f9 75%
      );
      background-size: 200% 100%;
      animation: skeleton-pulse 2s ease-in-out infinite;
    }

    @media (prefers-reduced-motion: reduce) {
      .skeleton {
        animation: none;
        background: #f1f5f9;
      }
    }

    @keyframes skeleton-pulse {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `],
})
export class SkeletonComponent {
  /** Kiểu skeleton */
  @Input() variant: SkeletonVariant = 'text';

  /** Chiều rộng */
  @Input() width = '100%';

  /** Chiều cao */
  @Input() height = 'auto';

  /** Số dòng (cho table-row variant) */
  @Input() rows = 3;

  /** Số cột (cho table-row variant) */
  @Input() cols = 4;

  /** Array helper cho ngFor */
  get rowsArray(): number[] {
    return Array.from({ length: this.rows }, (_, i) => i);
  }

  /** Array helper cho ngFor */
  get colsArray(): number[] {
    return Array.from({ length: this.cols }, (_, i) => i);
  }
}
