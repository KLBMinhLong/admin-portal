/**
 * Shared Components — Public API barrel export.
 *
 * Import from '@shared/components' thay vì import trực tiếp từng component.
 *
 * @example
 * import { ButtonComponent, IconComponent, AlertComponent } from '@shared/components';
 */

// ─── Atoms ───
export { IconComponent } from './icon/icon.component';
export { ICON_REGISTRY } from './icon/icon-registry';
export { SpinnerComponent } from './spinner/spinner.component';
export { ButtonComponent, ButtonVariant, ButtonSize } from './button/button.component';
export { BadgeComponent, BadgeVariant, BadgeSize } from './badge/badge.component';
export { StatusBadgeComponent } from './status-badge/status-badge.component';

// ─── Form Molecules ───
export { InputComponent } from './input/input.component';
export { SelectComponent, SelectOption } from './select/select.component';
export { FormFieldComponent } from './form-field/form-field.component';
export { AlertComponent, AlertVariant } from './alert/alert.component';
export { SearchBarComponent } from './search-bar/search-bar.component';

// ─── Layout Components ───
export { CardComponent, CardPadding } from './card/card.component';
export { StatCardComponent } from './stat-card/stat-card.component';
export { PageHeaderComponent } from './page-header/page-header.component';
export { EmptyStateComponent } from './empty-state/empty-state.component';
export { SkeletonComponent, SkeletonVariant } from './skeleton/skeleton.component';

// ─── Complex Organisms ───
export { ModalComponent, ModalSize } from './modal/modal.component';
export { ConfirmDialogComponent, ConfirmVariant } from './confirm-dialog/confirm-dialog.component';
export { ToastContainerComponent } from './toast/toast-container.component';
export { ToastService, ToastItem } from './toast/toast.service';
export { DataTableComponent } from './data-table/data-table.component';
export { TableColumn, SortEvent } from './data-table/data-table.models';
export { PaginationComponent } from './pagination/pagination.component';

// ─── Existing (kept as-is) ───
export { ForbiddenComponent } from './forbidden/forbidden.component';
