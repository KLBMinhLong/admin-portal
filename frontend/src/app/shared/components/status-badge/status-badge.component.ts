import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RequestStatus, STATUS_CONFIG } from '@core/models/request.models';
import { BadgeComponent, BadgeVariant } from '../badge/badge.component';

/**
 * Status Badge Component — hiển thị trạng thái workflow yêu cầu.
 *
 * Nâng cấp: dùng app-badge bên trong, mapping RequestStatus → BadgeVariant.
 * Giữ nguyên selector và @Input API cho backward compatibility.
 *
 * @example
 * <app-status-badge [status]="request.status" />
 * <app-status-badge status="APPROVED" />
 *
 * @see Design System section 2.3 — Status Mapping
 * @see SHARED-COMPONENTS-STRATEGY.md — Atom component
 */
@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule, BadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-badge [variant]="badgeVariant" [dot]="true">
      {{ config.label }}
    </app-badge>
  `,
})
export class StatusBadgeComponent {
  /** Trạng thái request từ workflow */
  @Input({ required: true }) status!: RequestStatus;

  /** Lấy config hiển thị từ STATUS_CONFIG */
  get config() {
    return STATUS_CONFIG[this.status] || STATUS_CONFIG['DRAFT'];
  }

  /** Mapping RequestStatus → BadgeVariant */
  get badgeVariant(): BadgeVariant {
    const map: Record<RequestStatus, BadgeVariant> = {
      DRAFT: 'info',
      SUBMITTED: 'info',
      PENDING_APPROVAL: 'warning',
      APPROVED: 'success',
      REJECTED: 'error',
      CANCELLED: 'neutral',
    };
    return map[this.status] || 'neutral';
  }
}
