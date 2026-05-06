import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { ToastService, ToastItem } from './toast.service';

/**
 * Toast Container Component — render tất cả toast notifications.
 *
 * Phải đặt 1 lần duy nhất trong app.component hoặc shell layout.
 * Tự động subscribe ToastService để render/dismiss.
 *
 * @example
 * <!-- Trong app.component.ts template -->
 * <router-outlet />
 * <app-toast-container />
 *
 * @see Design System section 5.8 — Toast / Notification
 *   Position: fixed top-4 right-4, z-index 50, auto-dismiss 5s
 */
@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 w-96 max-w-[calc(100vw-2rem)]">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="flex items-start gap-3 bg-white rounded-xl shadow-lg border p-4
                 animate-slideIn"
          [ngClass]="getBorderClass(toast)"
          role="alert"
        >
          <!-- Icon -->
          <div class="shrink-0 mt-0.5" [ngClass]="getIconColorClass(toast)">
            <app-icon [name]="getIconName(toast)" size="sm" />
          </div>

          <!-- Message -->
          <p class="flex-1 text-sm text-slate-700 min-w-0">
            {{ toast.message }}
          </p>

          <!-- Close button -->
          <button
            type="button"
            (click)="toastService.dismiss(toast.id)"
            class="shrink-0 p-1 text-slate-400 hover:text-slate-600
                   rounded transition-colors cursor-pointer"
            aria-label="Đóng thông báo"
          >
            <app-icon name="x" size="xs" />
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    .animate-slideIn {
      animation: slideIn 300ms ease-out;
    }

    @media (prefers-reduced-motion: reduce) {
      .animate-slideIn {
        animation: none;
      }
    }
  `],
})
export class ToastContainerComponent {
  constructor(public toastService: ToastService) {}

  /** CSS class cho border-left theo variant */
  getBorderClass(toast: ToastItem): string {
    const map: Record<string, string> = {
      success: 'border-l-4 border-l-green-500 border-slate-200',
      error: 'border-l-4 border-l-red-500 border-slate-200',
      warning: 'border-l-4 border-l-amber-500 border-slate-200',
      info: 'border-l-4 border-l-blue-500 border-slate-200',
    };
    return map[toast.variant] || map['info'];
  }

  /** Icon name theo variant */
  getIconName(toast: ToastItem): string {
    const map: Record<string, string> = {
      success: 'check-circle',
      error: 'x-circle',
      warning: 'alert-triangle',
      info: 'info',
    };
    return map[toast.variant] || 'info';
  }

  /** CSS class cho icon color */
  getIconColorClass(toast: ToastItem): string {
    const map: Record<string, string> = {
      success: 'text-green-500',
      error: 'text-red-500',
      warning: 'text-amber-500',
      info: 'text-blue-500',
    };
    return map[toast.variant] || 'text-blue-500';
  }
}
