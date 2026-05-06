import { TemplateRef } from '@angular/core';

/**
 * Column definition cho Data Table.
 *
 * @example
 * const columns: TableColumn[] = [
 *   { key: 'username', label: 'Người dùng', sortable: true },
 *   { key: 'role', label: 'Role' },
 *   { key: 'status', label: 'Trạng thái', align: 'center' },
 *   { key: 'createdAt', label: 'Tạo lúc', sortable: true },
 *   { key: 'actions', label: 'Hành động', align: 'right', template: actionsTpl },
 * ];
 */
export interface TableColumn {
  /** Key mapping tới property của data row */
  key: string;

  /** Label hiển thị trên header */
  label: string;

  /** Cho phép sort column này */
  sortable?: boolean;

  /** Text alignment */
  align?: 'left' | 'center' | 'right';

  /** Custom CSS class cho header cell */
  headerClass?: string;

  /** Custom CSS class cho body cell */
  cellClass?: string;

  /** Custom template cho cell content — nhận implicit context { $implicit: row, column } */
  template?: TemplateRef<any>;
}

/**
 * Sort event emitted khi user click column header.
 */
export interface SortEvent {
  /** Column key */
  column: string;

  /** Sort direction */
  direction: 'asc' | 'desc' | null;
}
