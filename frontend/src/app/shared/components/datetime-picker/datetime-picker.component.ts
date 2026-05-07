import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormFieldComponent } from '../form-field/form-field.component';

/**
 * Shared DateTime Picker Component
 * 
 * Dumb component: nhận date value, emit dateChange
 * Dùng cho range selection (từ - tới)
 * 
 * @example
 * <app-datetime-picker
 *   [value]="fromDate()"
 *   label="Từ ngày"
 *   (dateChange)="fromDate.set($event)"
 * />
 */
@Component({
  selector: 'app-datetime-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, FormFieldComponent],
  template: `
    <app-form-field [label]="label" [fieldId]="fieldId">
      <input
        [id]="fieldId"
        type="datetime-local"
        [value]="isoValue()"
        (change)="onDateChange($any($event.target).value)"
        [disabled]="disabled"
        class="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none 
               transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 
               disabled:bg-slate-100 disabled:opacity-50"
      />
    </app-form-field>
  `,
})
export class DatetimePickerComponent {
  @Input() label = 'Ngày giờ';
  @Input() fieldId = 'datetime-' + Math.random().toString(36).substr(2, 9);
  @Input() value: Date | null = null;
  @Input() disabled = false;
  @Output() dateChange = new EventEmitter<Date>();

  isoValue = signal<string>('');

  ngOnChanges(): void {
    if (this.value) {
      this.isoValue.set(this.toISOLocal(this.value));
    } else {
      this.isoValue.set('');
    }
  }

  onDateChange(isoString: string): void {
    if (!isoString) {
      this.dateChange.emit(null!);
      return;
    }
    // Convert from HTML datetime-local format to Date
    const date = new Date(isoString);
    this.dateChange.emit(date);
  }

  private toISOLocal(date: Date): string {
    const yyyy = date.getFullYear().toString().padStart(4, '0');
    const MM = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    const hh = date.getHours().toString().padStart(2, '0');
    const mm = date.getMinutes().toString().padStart(2, '0');
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
  }
}
