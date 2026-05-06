import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Shared Form Field Component — wrapper cho Label + Input + Error/Hint.
 *
 * Dumb component: chỉ layout, không có logic.
 * Đảm bảo mọi form field đều có label liên kết (accessibility).
 *
 * @example
 * <app-form-field label="Tên đăng nhập" fieldId="login-username" [required]="true"
 *                 [error]="form.get('username')?.touched && form.get('username')?.hasError('required') ? 'Vui lòng nhập tên đăng nhập' : ''">
 *   <app-input formControlName="username" fieldId="login-username" placeholder="Nhập tên đăng nhập" />
 * </app-form-field>
 *
 * @see Design System section 5.5 — Form Inputs (LUÔN có label)
 * @see SHARED-COMPONENTS-STRATEGY.md — Molecule component
 */
@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-1">
      <!-- Label -->
      <label
        [for]="fieldId"
        class="block text-sm font-medium text-slate-700"
      >
        {{ label }}
        @if (required) {
          <span class="text-red-500 ml-0.5">*</span>
        }
      </label>

      <!-- Input slot (ng-content) -->
      <ng-content />

      <!-- Error message -->
      @if (error) {
        <p class="text-xs text-red-600 mt-1" role="alert">
          {{ error }}
        </p>
      }

      <!-- Hint text -->
      @if (hint && !error) {
        <p class="text-xs text-slate-500 mt-1">
          {{ hint }}
        </p>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `],
})
export class FormFieldComponent {
  /** Label text */
  @Input({ required: true }) label!: string;

  /** ID cho liên kết label ↔ input (phải khớp với fieldId của app-input) */
  @Input({ required: true }) fieldId!: string;

  /** Hiển thị dấu * bắt buộc */
  @Input() required = false;

  /** Thông báo lỗi validation — hiển thị màu đỏ */
  @Input() error = '';

  /** Gợi ý — hiển thị màu xám (ẩn khi có error) */
  @Input() hint = '';
}
