import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Card padding size type.
 */
export type CardPadding = 'sm' | 'md' | 'lg' | 'none';

/**
 * Shared Card Component — container trắng chuẩn.
 *
 * Dumb component: chỉ cung cấp layout container.
 * Hỗ trợ header, body (default), footer slots qua ng-content select.
 *
 * @example
 * <!-- Card đơn giản -->
 * <app-card>Nội dung card</app-card>
 *
 * <!-- Card có header + footer -->
 * <app-card>
 *   <div cardHeader>Tiêu đề</div>
 *   <p>Nội dung chính</p>
 *   <div cardFooter>Footer actions</div>
 * </app-card>
 *
 * <!-- Card hoverable -->
 * <app-card [hoverable]="true" (click)="onCardClick()">Clickable card</app-card>
 *
 * @see Design System section 5.4 — Cards
 * @see SHARED-COMPONENTS-STRATEGY.md — Molecule component
 */
@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
      [class.hover:shadow-md]="hoverable"
      [class.transition-shadow]="hoverable"
      [class.cursor-pointer]="hoverable"
    >
      <!-- Card Header (optional slot) -->
      <ng-content select="[cardHeader]" />

      <!-- Card Body (default) -->
      <div [ngClass]="paddingClasses">
        <ng-content />
      </div>

      <!-- Card Footer (optional slot) -->
      <ng-content select="[cardFooter]" />
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `],
})
export class CardComponent {
  /** Có hover effect không (cho clickable cards) */
  @Input() hoverable = false;

  /** Padding cho body area */
  @Input() padding: CardPadding = 'md';

  /** CSS classes cho padding */
  get paddingClasses(): string {
    const map: Record<CardPadding, string> = {
      none: '',
      sm: 'p-4',
      md: 'p-5',
      lg: 'p-6',
    };
    return map[this.padding];
  }
}
