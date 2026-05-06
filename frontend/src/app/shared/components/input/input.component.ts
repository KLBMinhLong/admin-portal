import {
  Component, Input, forwardRef, ChangeDetectionStrategy,
  signal, HostBinding,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor, NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';

/**
 * Shared Input Component — text input chuẩn với ControlValueAccessor.
 *
 * Dumb component: tích hợp ReactiveFormsModule qua CVA.
 * Feature components phải dùng <app-input> thay vì <input> HTML thuần.
 *
 * @example
 * <!-- Với ReactiveFormsModule -->
 * <app-input formControlName="username" type="text" placeholder="Nhập tên" />
 *
 * <!-- Với ngModel -->
 * <app-input [(ngModel)]="searchTerm" placeholder="Tìm kiếm..." />
 *
 * <!-- Với error state -->
 * <app-input formControlName="email" [hasError]="true" />
 *
 * @see Design System section 5.5 — Form Inputs
 * @see SHARED-COMPONENTS-STRATEGY.md — Molecule component
 */
@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
  template: `
    <input
      [type]="type"
      [id]="fieldId"
      [placeholder]="placeholder"
      [autocomplete]="autocomplete"
      [disabled]="isDisabled()"
      [value]="value()"
      (input)="onInput($event)"
      (blur)="onTouched()"
      class="w-full px-3 py-2 border rounded-lg text-sm outline-none
             transition-colors duration-200"
      [class.border-slate-300]="!hasError"
      [class.focus:ring-2]="true"
      [class.focus:ring-blue-500]="!hasError"
      [class.focus:border-blue-500]="!hasError"
      [class.border-red-400]="hasError"
      [class.focus:ring-red-500]="hasError"
      [class.focus:border-red-500]="hasError"
      [class.bg-slate-50]="isDisabled()"
      [class.cursor-not-allowed]="isDisabled()"
    />
  `,
  styles: [`
    :host {
      display: block;
    }
  `],
})
export class InputComponent implements ControlValueAccessor {
  /** Type attribute cho input */
  @Input() type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date' = 'text';

  /** ID cho liên kết với label */
  @Input() fieldId = '';

  /** Placeholder text */
  @Input() placeholder = '';

  /** Autocomplete attribute */
  @Input() autocomplete = '';

  /** Hiển thị error state (border đỏ) */
  @Input() hasError = false;

  /** Giá trị nội bộ */
  value = signal('');

  /** Trạng thái disabled */
  isDisabled = signal(false);

  /** Callback khi value thay đổi */
  private _onChange: (value: string) => void = () => {};

  /** Callback khi input bị blur */
  onTouched: () => void = () => {};

  /** ControlValueAccessor: ghi giá trị từ form */
  writeValue(value: string): void {
    this.value.set(value ?? '');
  }

  /** ControlValueAccessor: đăng ký onChange */
  registerOnChange(fn: (value: string) => void): void {
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

  /** Xử lý input event */
  onInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    this.value.set(inputValue);
    this._onChange(inputValue);
  }
}
