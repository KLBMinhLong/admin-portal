import { Component, EventEmitter, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { AdminRole } from '@core/models/role.models';

import { FormFieldComponent } from '@shared/components/form-field/form-field.component';
import { InputComponent } from '@shared/components/input/input.component';
import { ButtonComponent } from '@shared/components/button/button.component';

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FormFieldComponent,
    InputComponent,
    ButtonComponent,
  ],
  template: `
    <form [formGroup]="roleForm" (ngSubmit)="onSubmit()" class="space-y-4">
      <app-form-field label="Mã Role" fieldId="roleCode" [required]="!isEdit()" [error]="getFieldError('code')">
        <app-input formControlName="code" placeholder="VD: FINANCE_MANAGER" [hasError]="hasFieldError('code')" />
        @if (!isEdit()) {
          <p class="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">Mã định danh duy nhất, không chứa khoảng trắng</p>
        }
      </app-form-field>
      
      <app-form-field label="Tên hiển thị" fieldId="roleName" [required]="true" [error]="getFieldError('name')">
        <app-input formControlName="name" placeholder="VD: Quản lý Tài chính" [hasError]="hasFieldError('name')" />
      </app-form-field>
      
      <app-form-field label="Mô tả" fieldId="roleDesc">
        <textarea formControlName="description" rows="3" placeholder="Mô tả chức năng của role này..."
          class="w-full px-3 py-2 border rounded-lg text-sm outline-none transition-colors duration-200 border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none">
        </textarea>
      </app-form-field>
      
      <div class="mt-6 flex justify-end gap-3 pt-2 border-t border-slate-200">
        <app-button type="button" variant="secondary" (onClick)="onCancel()">Hủy</app-button>
        <app-button type="submit" variant="primary" [disabled]="roleForm.invalid" [loading]="isSubmitting()">
          Lưu thông tin
        </app-button>
      </div>
    </form>
  `
})
export class RoleFormComponent {
  isEdit = input<boolean>(false);
  initialData = input<AdminRole | null>(null);
  
  submitted = output<any>();
  cancelled = output<void>();

  isSubmitting = signal(false);

  roleForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.roleForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern('^[A-Z0-9_]+$')]],
      name: ['', Validators.required],
      description: ['']
    });

    effect(() => {
      const data = this.initialData();
      const editMode = this.isEdit();
      
      if (editMode && data) {
        this.roleForm.patchValue({
          code: data.code,
          name: data.name,
          description: data.description
        });
        this.roleForm.get('code')?.disable();
      } else {
        this.roleForm.reset();
        this.roleForm.get('code')?.enable();
      }
    });
  }

  hasFieldError(field: string): boolean {
    const control = this.roleForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getFieldError(field: string): string {
    const control = this.roleForm.get(field);
    if (!control || !control.errors || (!control.dirty && !control.touched)) return '';
    
    if (control.errors['required']) return 'Trường này là bắt buộc';
    if (control.errors['pattern']) return 'Mã Role chỉ chứa ký tự in hoa, số và dấu gạch dưới';
    return 'Dữ liệu không hợp lệ';
  }

  onSubmit(): void {
    if (this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();
      return;
    }
    const roleData = this.roleForm.getRawValue();
    this.submitted.emit(roleData);
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  setSubmitting(value: boolean): void {
    this.isSubmitting.set(value);
  }
}
