import { Component, EventEmitter, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminUserRoleOption, CreateAdminUserRequest } from '@core/models/user.models';
import { UserManagementService } from '@core/services/user-management.service';

// Shared Components
import { FormFieldComponent } from '@shared/components/form-field/form-field.component';
import { InputComponent } from '@shared/components/input/input.component';
import { AlertComponent } from '@shared/components/alert/alert.component';
import { ButtonComponent } from '@shared/components/button/button.component';

/**
 * User Create Form Component — Dumb/Presentational Component
 * Chỉ lo về hiển thị và emit dữ liệu
 * Tách logic form khỏi list component
 */
@Component({
  selector: 'app-user-create-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FormFieldComponent,
    InputComponent,
    AlertComponent,
    ButtonComponent,
  ],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5 px-6 py-6">
      <div class="grid gap-4 md:grid-cols-2">
        <app-form-field label="Username" fieldId="create-username" [required]="true">
          <app-input formControlName="username" fieldId="create-username" />
        </app-form-field>

        <app-form-field label="Email" fieldId="create-email" [required]="true">
          <app-input formControlName="email" fieldId="create-email" type="email" />
        </app-form-field>

        <app-form-field label="Tên" fieldId="create-firstName">
          <app-input formControlName="firstName" fieldId="create-firstName" />
        </app-form-field>

        <app-form-field label="Họ" fieldId="create-lastName">
          <app-input formControlName="lastName" fieldId="create-lastName" />
        </app-form-field>

        <app-form-field
          label="Mật khẩu"
          fieldId="create-password"
          [required]="true"
          hint="Ít nhất 12 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt."
          class="md:col-span-2"
        >
          <app-input formControlName="password" fieldId="create-password" type="password" />
        </app-form-field>

        <app-form-field label="Role" fieldId="create-role" [required]="true">
          <select
            id="create-role"
            formControlName="roleCode"
            class="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
          >
            @for (role of roleOptions(); track role.id) {
              <option [value]="role.code">{{ role.name }}</option>
            }
          </select>
        </app-form-field>

        <label class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <input
            formControlName="active"
            type="checkbox"
            class="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
          />
          <span>
            <span class="block text-sm font-medium text-slate-700">Kích hoạt ngay</span>
            <span class="block text-xs text-slate-500">Nếu bỏ chọn, tài khoản được tạo nhưng chưa thể đăng nhập.</span>
          </span>
        </label>
      </div>

      @if (errorMsg()) {
        <app-alert variant="error">{{ errorMsg() }}</app-alert>
      }

      <div class="flex justify-end gap-3 border-t border-slate-200 pt-4">
        <app-button variant="secondary" (click)="onCancel()">Hủy</app-button>
        <app-button
          type="submit"
          [loading]="isSubmitting()"
          [disabled]="form.invalid || isSubmitting()"
        >
          {{ isSubmitting() ? 'Đang tạo...' : 'Tạo người dùng' }}
        </app-button>
      </div>
    </form>
  `,
})
export class UserCreateFormComponent {
  roleOptions = input<AdminUserRoleOption[]>([]);
  isSubmitting = signal(false);
  errorMsg = signal('');

  // Output events
  submitted = output<CreateAdminUserRequest>();
  cancelled = output<void>();

  form = this.formBuilder.nonNullable.group({
    username: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-Z0-9_]+$/),
      ],
    ],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(12)]],
    firstName: [''],
    lastName: [''],
    roleCode: ['', Validators.required],
    active: [true],
  });

  constructor(private readonly formBuilder: FormBuilder) {}

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: CreateAdminUserRequest = {
      username: raw.username,
      email: raw.email,
      password: raw.password,
      firstName: raw.firstName || null,
      lastName: raw.lastName || null,
      roleCode: raw.roleCode,
      active: raw.active,
    };

    this.submitted.emit(payload);
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  resetForm(): void {
    this.form.reset({
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      roleCode: this.roleOptions()[0]?.code ?? '',
      active: true,
    });
    this.errorMsg.set('');
  }

  setSubmitting(value: boolean): void {
    this.isSubmitting.set(value);
  }

  setError(error: string): void {
    this.errorMsg.set(error);
  }

  clearError(): void {
    this.errorMsg.set('');
  }
}
