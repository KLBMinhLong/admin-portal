import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy, computed, signal, TemplateRef,
  ContentChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableColumn, SortEvent } from './data-table.models';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { IconComponent } from '../icon/icon.component';

/**
 * Shared Data Table Component — bảng dữ liệu chuẩn.
 *
 * Dumb component: nhận data + columns, render table.
 * Hỗ trợ loading skeleton, empty state, sorting, custom cell templates.
 *
 * @example
 * <!-- Basic -->
 * <app-data-table [columns]="columns" [data]="users()" [loading]="loading()" />
 *
 * <!-- With custom cell template -->
 * <app-data-table [columns]="columns" [data]="users()">
 *   <ng-template #cellTemplate let-row let-col="column">
 *     @if (col.key === 'actions') {
 *       <app-button size="sm" variant="secondary">Xem</app-button>
 *     }
 *   </ng-template>
 * </app-data-table>
 *
 * <!-- With footer info -->
 * <app-data-table [columns]="columns" [data]="filteredUsers()" [loading]="loading()"
 *   footerText="Hiển thị {{ filteredUsers().length }} / {{ allUsers().length }} kết quả"
 * />
 *
 * @see Design System section 5.6 — Data Tables
 * @see SHARED-COMPONENTS-STRATEGY.md — Organism component
 */
@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, SkeletonComponent, EmptyStateComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      @if (loading) {
        <app-skeleton variant="table-row" [rows]="skeletonRows" [cols]="columns.length" />
      } @else {
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200">
            <!-- Header -->
            <thead class="bg-slate-50">
              <tr>
                @for (col of columns; track col.key) {
                  <th
                    class="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500"
                    [class.text-left]="col.align !== 'center' && col.align !== 'right'"
                    [class.text-center]="col.align === 'center'"
                    [class.text-right]="col.align === 'right'"
                    [class.cursor-pointer]="col.sortable"
                    [class.select-none]="col.sortable"
                    [class.hover:text-slate-700]="col.sortable"
                    (click)="col.sortable ? onSort(col.key) : null"
                  >
                    <span class="inline-flex items-center gap-1">
                      {{ col.label }}
                      @if (col.sortable) {
                        @if (sortColumn === col.key && sortDirection === 'asc') {
                          <app-icon name="chevron-up" size="xs" />
                        } @else if (sortColumn === col.key && sortDirection === 'desc') {
                          <app-icon name="chevron-down" size="xs" />
                        }
                      }
                    </span>
                  </th>
                }
              </tr>
            </thead>

            <!-- Body -->
            <tbody class="divide-y divide-slate-100">
              @for (row of data; track trackByFn($index, row)) {
                <tr
                  class="transition hover:bg-slate-50/70"
                  [class.cursor-pointer]="rowClickable"
                  (click)="rowClickable ? rowClick.emit(row) : null"
                >
                  @for (col of columns; track col.key) {
                    <td
                      class="px-6 py-4"
                      [class.text-left]="col.align !== 'center' && col.align !== 'right'"
                      [class.text-center]="col.align === 'center'"
                      [class.text-right]="col.align === 'right'"
                      [ngClass]="col.cellClass || ''"
                    >
                      @if (col.template) {
                        <ng-container
                          [ngTemplateOutlet]="col.template"
                          [ngTemplateOutletContext]="{ $implicit: row, column: col }"
                        />
                      } @else {
                        <span class="text-sm text-slate-700">
                          {{ getNestedValue(row, col.key) }}
                        </span>
                      }
                    </td>
                  }
                </tr>
              } @empty {
                <tr>
                  <td [colSpan]="columns.length">
                    <app-empty-state
                      [icon]="emptyIcon"
                      [title]="emptyText"
                      [message]="emptyMessage"
                    />
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Footer -->
        @if (footerText && data.length > 0) {
          <div class="border-t border-slate-200 bg-slate-50 px-6 py-3 text-xs text-slate-500">
            {{ footerText }}
          </div>
        }
      }
    </div>
  `,
})
export class DataTableComponent {
  /** Định nghĩa columns */
  @Input({ required: true }) columns: TableColumn[] = [];

  /** Dữ liệu rows */
  @Input({ required: true }) data: any[] = [];

  /** Đang tải dữ liệu */
  @Input() loading = false;

  /** Text hiển thị khi không có dữ liệu */
  @Input() emptyText = 'Không có dữ liệu';

  /** Message phụ khi không có dữ liệu */
  @Input() emptyMessage = '';

  /** Icon cho empty state */
  @Input() emptyIcon = 'inbox';

  /** Số skeleton rows khi loading */
  @Input() skeletonRows = 5;

  /** Footer text (ví dụ: "Hiển thị 10/50 kết quả") */
  @Input() footerText = '';

  /** Track by key cho ngFor */
  @Input() trackKey = 'id';

  /** Cho phép click vào row */
  @Input() rowClickable = false;

  /** Emit khi user click row */
  @Output() rowClick = new EventEmitter<any>();

  /** Emit khi user sort column */
  @Output() sort = new EventEmitter<SortEvent>();

  /** Current sort state */
  sortColumn = '';
  sortDirection: 'asc' | 'desc' | null = null;

  /** Xử lý sort click */
  onSort(columnKey: string): void {
    if (this.sortColumn === columnKey) {
      // Toggle direction
      this.sortDirection = this.sortDirection === 'asc' ? 'desc'
        : this.sortDirection === 'desc' ? null : 'asc';
    } else {
      this.sortColumn = columnKey;
      this.sortDirection = 'asc';
    }

    this.sort.emit({
      column: this.sortColumn,
      direction: this.sortDirection,
    });
  }

  /** Track by function cho ngFor */
  trackByFn(index: number, item: any): any {
    return item[this.trackKey] ?? index;
  }

  /** Lấy nested value từ object (hỗ trợ dot notation: 'user.name') */
  getNestedValue(obj: any, key: string): any {
    return key.split('.').reduce((o, k) => o?.[k], obj) ?? '';
  }
}
