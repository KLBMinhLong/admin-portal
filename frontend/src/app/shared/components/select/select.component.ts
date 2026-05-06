import {
  Component, Input, forwardRef, ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor, NG_VALUE_ACCESSOR,
} from '@angular/forms';

/**
 * Option interface cho select dropdown.
 */
export interface SelectOption {
  label: string;
  value: any;
}

/**
 * Shared Select Component — dropdown chuẩn với ControlValueAccessor.
 *
 * Dumb component: tích hợp ReactiveFormsModule qua CVA.
 * Feature components phải dùng <app-select> thay vì <select> HTML thuần.
 *
 * @example
 * <app-select
 *   formControlName="roleCode"
 *   [options]="roleOptions"
 *   placeholder="Chọn role"
 * />
 *
 * @see Design System section 5.5 — Form Inputs
 * @see SHARED-COMPONENTS-STRATEGY.md — Molecule component
 */
@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
  template: `
    <select
      [id]="fieldId"
      [disabled]="isDisabled()"
      [value]="value()"
      (change)="onChange($event)"
      (blur)="onTouched()"
      class="app-select w-full px-3 py-2 border rounded-lg text-sm outline-none
             transition-colors duration-200 appearance-none pr-8 cursor-pointer"
      [class.border-slate-300]="!hasError"
      [class.focus:ring-2]="true"
      [class.focus:ring-blue-500]="!hasError"
      [class.focus:border-blue-500]="!hasError"
      [class.border-red-400]="hasError"
      [class.focus:ring-red-500]="hasError"
      [class.focus:border-red-500]="hasError"
      [class.bg-slate-50]="isDisabled()"
      [class.cursor-not-allowed]="isDisabled()"
    >
      @if (placeholder) {
        <option value="" disabled [selected]="!value()">{{ placeholder }}</option>
      }
      @for (opt of options; track opt.value) {
        <option [value]="opt.value">{{ opt.label }}</option>
      }
    </select>
  `,
  styles: [`
    :host {
      display: block;
    }
    .app-select {
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
      background-size: 1.5em 1.5em;
      background-position: right 0.5rem center;
      background-repeat: no-repeat;
    }
  `],
})
export class SelectComponent implements ControlValueAccessor {
  /** ID cho liên kết với label */
  @Input() fieldId = '';

  /** Danh sách options */
  @Input() options: SelectOption[] = [];

  /** Placeholder text */
  @Input() placeholder = '';

  /** Hiển thị error state (border đỏ) */
  @Input() hasError = false;

  /** Giá trị nội bộ */
  value = signal<any>('');

  /** Trạng thái disabled */
  isDisabled = signal(false);

  /** Callback khi value thay đổi */
  private _onChange: (value: any) => void = () => {};

  /** Callback khi select bị blur */
  onTouched: () => void = () => {};

  /** ControlValueAccessor: ghi giá trị từ form */
  writeValue(value: any): void {
    this.value.set(value ?? '');
  }

  /** ControlValueAccessor: đăng ký onChange */
  registerOnChange(fn: (value: any) => void): void {
    this._onChange = fn;
  }

  /** ControlValueAccessor: đăng ký onTouched */
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  /** ControlValueAccessor: set disabled state */
  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  /** Xử lý change event */
  onChange(event: Event): void {
    const selectValue = (event.target as HTMLSelectElement).value;
    this.value.set(selectValue);
    this._onChange(selectValue);
  }
}
