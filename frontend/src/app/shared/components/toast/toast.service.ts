import { Injectable, signal, computed } from '@angular/core';

/**
 * Toast item interface.
 */
export interface ToastItem {
  id: number;
  variant: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration: number;
}

/**
 * Toast Service — quản lý global toast notifications.
 *
 * Singleton service, inject ở bất kỳ đâu để hiện toast.
 * ToastContainerComponent sẽ subscribe để render.
 *
 * @example
 * // Trong Smart Component
 * constructor(private toast: ToastService) {}
 *
 * onSuccess() {
 *   this.toast.success('Tạo người dùng thành công!');
 * }
 *
 * onError() {
 *   this.toast.error('Không thể kết nối đến server.');
 * }
 *
 * @see Design System section 5.8 — Toast / Notification
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  /** Danh sách toast đang hiển thị */
  private _toasts = signal<ToastItem[]>([]);

  /** Public computed cho component binding */
  readonly toasts = computed(() => this._toasts());

  /** ID counter */
  private _nextId = 0;

  /** Hiện toast success */
  success(message: string, duration = 5000): void {
    this._addToast('success', message, duration);
  }

  /** Hiện toast error */
  error(message: string, duration = 7000): void {
    this._addToast('error', message, duration);
  }

  /** Hiện toast warning */
  warning(message: string, duration = 5000): void {
    this._addToast('warning', message, duration);
  }

  /** Hiện toast info */
  info(message: string, duration = 5000): void {
    this._addToast('info', message, duration);
  }

  /** Xóa toast theo ID */
  dismiss(id: number): void {
    this._toasts.update(list => list.filter(t => t.id !== id));
  }

  /** Thêm toast mới */
  private _addToast(
    variant: ToastItem['variant'],
    message: string,
    duration: number,
  ): void {
    const id = ++this._nextId;
    const toast: ToastItem = { id, variant, message, duration };

    this._toasts.update(list => [...list, toast]);

    // Auto dismiss
    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }
}
