import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy, HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

/**
 * Modal size type.
 */
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * Shared Modal Component — dialog popup chuẩn.
 *
 * Dumb component: quản lý backdrop, animation, close behavior.
 * Feature components dùng <app-modal> thay vì tự build modal HTML.
 *
 * @example
 * <app-modal
 *   [open]="showCreateModal()"
 *   title="Tạo người dùng mới"
 *   subtitle="Create User"
 *   (closed)="closeCreateModal()"
 * >
 *   <div modalBody>
 *     <form>...</form>
 *   </div>
 *   <div modalFooter>
 *     <app-button variant="secondary" (click)="close()">Hủy</app-button>
 *     <app-button type="submit">Tạo</app-button>
 *   </div>
 * </app-modal>
 *
 * @see Design System section 6 — Motion and Animation (Modal enter/exit)
 * @see SHARED-COMPONENTS-STRATEGY.md — Organism component
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open) {
      <!-- Backdrop -->
      <div
        class="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm
               transition-opacity duration-200"
        [class.animate-fadeIn]="open"
        (click)="onBackdropClick()"
      ></div>

      <!-- Modal Container -->
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
        role="dialog"
        [attr.aria-modal]="true"
        [attr.aria-label]="title"
      >
        <div
          class="w-full bg-white rounded-2xl border border-slate-200 shadow-2xl
                 transform transition-all duration-300 ease-out"
          [class.animate-modalIn]="open"
          [ngClass]="sizeClasses"
          (click)="$event.stopPropagation()"
        >
          <!-- Header -->
          @if (title || subtitle) {
            <div class="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                @if (subtitle) {
                  <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {{ subtitle }}
                  </p>
                }
                @if (title) {
                  <h2 class="mt-1 text-xl font-bold text-slate-900">{{ title }}</h2>
                }
                @if (description) {
                  <p class="mt-1 text-sm text-slate-500">{{ description }}</p>
                }
              </div>
              @if (closable) {
                <button
                  type="button"
                  (click)="close()"
                  class="rounded-xl p-2 text-slate-400 transition
                         hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                  aria-label="Đóng"
                >
                  <app-icon name="x" size="sm" />
                </button>
              }
            </div>
          }

          <!-- Body -->
          <ng-content select="[modalBody]" />

          <!-- Footer -->
          <ng-content select="[modalFooter]" />
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes modalIn {
      from { opacity: 0; transform: scale(0.95) translateY(10px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    .animate-fadeIn { animation: fadeIn 200ms ease-out; }
    .animate-modalIn { animation: modalIn 300ms ease-out; }

    @media (prefers-reduced-motion: reduce) {
      .animate-fadeIn, .animate-modalIn {
        animation: none;
      }
    }
  `],
})
export class ModalComponent {
  /** Mở/đóng modal */
  @Input() open = false;

  /** Tiêu đề chính */
  @Input() title = '';

  /** Subtitle (overline text nhỏ) */
  @Input() subtitle = '';

  /** Mô tả ngắn */
  @Input() description = '';

  /** Kích thước modal */
  @Input() size: ModalSize = 'md';

  /** Cho phép đóng (nút X, backdrop click, Escape) */
  @Input() closable = true;

  /** Emit khi modal đóng */
  @Output() closed = new EventEmitter<void>();

  /** Đóng modal */
  close(): void {
    if (this.closable) {
      this.closed.emit();
    }
  }

  /** Click backdrop → đóng */
  onBackdropClick(): void {
    this.close();
  }

  /** Escape key → đóng */
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.open) {
      this.close();
    }
  }

  /** CSS classes theo size */
  get sizeClasses(): string {
    const map: Record<ModalSize, string> = {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
    };
    return map[this.size];
  }
}
