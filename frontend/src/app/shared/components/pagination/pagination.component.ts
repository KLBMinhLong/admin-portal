import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy, computed, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

/**
 * Shared Pagination Component — phân trang cho danh sách.
 *
 * Dumb component: nhận total + pageSize + currentPage, emit pageChange.
 * Dùng kèm app-data-table hoặc bất kỳ danh sách nào.
 *
 * @example
 * <app-pagination
 *   [total]="allUsers().length"
 *   [pageSize]="10"
 *   [currentPage]="currentPage()"
 *   (pageChange)="currentPage.set($event)"
 * />
 *
 * @see SHARED-COMPONENTS-STRATEGY.md — Organism component
 */
@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (totalPages() > 1) {
      <div class="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3">
        <!-- Info text -->
        <p class="text-xs text-slate-500">
          Hiển thị {{ startItem() }}-{{ endItem() }} / {{ total }} kết quả
        </p>

        <!-- Page controls -->
        <div class="flex items-center gap-1">
          <!-- Previous -->
          <button
            type="button"
            [disabled]="currentPage <= 1"
            (click)="goToPage(currentPage - 1)"
            class="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 transition-colors
                   cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Trang trước"
          >
            <app-icon name="chevron-left" size="sm" />
          </button>

          <!-- Page numbers -->
          @for (page of visiblePages(); track page) {
            @if (page === -1) {
              <span class="px-1 text-slate-400">…</span>
            } @else {
              <button
                type="button"
                (click)="goToPage(page)"
                class="min-w-[32px] h-8 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                [class.bg-slate-900]="page === currentPage"
                [class.text-white]="page === currentPage"
                [class.text-slate-600]="page !== currentPage"
                [class.hover:bg-slate-200]="page !== currentPage"
              >
                {{ page }}
              </button>
            }
          }

          <!-- Next -->
          <button
            type="button"
            [disabled]="currentPage >= totalPages()"
            (click)="goToPage(currentPage + 1)"
            class="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 transition-colors
                   cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Trang sau"
          >
            <app-icon name="chevron-right" size="sm" />
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
    }
  `],
})
export class PaginationComponent {
  /** Tổng số item */
  @Input({ required: true }) total = 0;

  /** Số item mỗi trang */
  @Input() pageSize = 10;

  /** Trang hiện tại (1-indexed) */
  @Input() currentPage = 1;

  /** Emit khi chuyển trang */
  @Output() pageChange = new EventEmitter<number>();

  /** Tổng số trang */
  totalPages = computed(() => Math.ceil(this.total / this.pageSize) || 1);

  /** Item bắt đầu của trang hiện tại */
  startItem = computed(() => (this.currentPage - 1) * this.pageSize + 1);

  /** Item kết thúc của trang hiện tại */
  endItem = computed(() => Math.min(this.currentPage * this.pageSize, this.total));

  /** Danh sách page numbers hiển thị (với ellipsis = -1) */
  visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage;
    const pages: number[] = [];

    if (total <= 7) {
      // Hiện hết
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      // Luôn hiện trang 1
      pages.push(1);

      if (current > 3) {
        pages.push(-1); // ellipsis
      }

      // Pages xung quanh current
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (current < total - 2) {
        pages.push(-1); // ellipsis
      }

      // Luôn hiện trang cuối
      pages.push(total);
    }

    return pages;
  });

  /** Chuyển tới trang */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }
}
