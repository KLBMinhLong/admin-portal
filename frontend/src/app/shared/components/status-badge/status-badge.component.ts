import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RequestStatus, STATUS_CONFIG } from '@core/models/request.models';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      [ngClass]="[config.bg, config.text]"
    >
      {{ config.label }}
    </span>
  `,
})
export class StatusBadgeComponent {
  @Input({ required: true }) status!: RequestStatus;

  get config() {
    return STATUS_CONFIG[this.status] || STATUS_CONFIG['DRAFT'];
  }
}
