import { Component, Input, Output, EventEmitter, signal, computed, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { AlertComponent } from '@shared/components/alert/alert.component';
import { AdminUserRoleOption } from '@core/models/user.models';
import { RoleDisplayPipe } from '@shared/pipes/role-display.pipe';

@Component({
  selector: 'app-role-management-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, ButtonComponent, AlertComponent, RoleDisplayPipe],
  template: `
    <app-modal
      [open]="open"
      title="Thêm Role"
      subtitle="Add Role"
      description="Chọn role từ danh sách để thêm vào người dùng."
      size="md"
      (closed)="onCancel()"
    >
      <div modalBody class="space-y-4">
        @if (errorMsg()) {
          <app-alert variant="error" [dismissible]="true" (dismissed)="errorMsg.set('')">
            {{ errorMsg() }}
          </app-alert>
        }

        @if (availableRoles().length === 0) {
          <div class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
            <p class="text-sm text-amber-800">Người dùng đã được gán tất cả role khả dụng.</p>
          </div>
        } @else {
          <div>
            <label for="roleSelect" class="mb-2 block text-sm font-medium text-slate-700">
              Chọn Role
              <span class="ml-1 text-red-500">*</span>
            </label>
            <select
              id="roleSelect"
              [(ngModel)]="selectedRoleCode"
              [disabled]="loading"
              class="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:opacity-50"
            >
              <option value="">-- Chọn role --</option>
              @for (role of availableRoles(); track role.id) {
                <option [value]="role.code">{{ role.code | roleDisplay:allRoles }}</option>
              }
            </select>
          </div>
        }
      </div>

      <div modalFooter class="flex justify-end gap-3">
        <app-button
          type="button"
          variant="secondary"
          [disabled]="loading"
          (click)="onCancel()"
        >
          Hủy
        </app-button>
        <app-button
          type="submit"
          variant="primary"
          [disabled]="!selectedRoleCode || loading || availableRoles().length === 0"
          [loading]="loading"
          (click)="onConfirm()"
        >
          Thêm Role
        </app-button>
      </div>
    </app-modal>
  `,
})
export class RoleManagementModalComponent implements OnChanges {
  @Input() open = false;
  @Input() allRoles: AdminUserRoleOption[] = [];
  @Input() currentRoleCodes: string[] = [];
  @Input() loading = false;
  @Output() roleAdded = new EventEmitter<string>();
  @Output() cancelled = new EventEmitter<void>();

  private allRolesSignal = signal<AdminUserRoleOption[]>([]);
  private currentRoleCodesSignal = signal<string[]>([]);

  errorMsg = signal('');
  selectedRoleCode = '';

  availableRoles = computed(() => {
    const allRoles = this.allRolesSignal() || [];
    const currentRoles = new Set(this.currentRoleCodesSignal() || []);
    return (allRoles || []).filter(role => !currentRoles.has(role.code));
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['allRoles'] || changes['currentRoleCodes']) {
      this.updateInputs();
    }
    if (changes['open'] && !this.open) {
      this.resetModal();
    }
  }

  private updateInputs(): void {
    this.allRolesSignal.set(this.allRoles || []);
    this.currentRoleCodesSignal.set(this.currentRoleCodes || []);
  }

  private resetModal(): void {
    this.selectedRoleCode = '';
    this.errorMsg.set('');
  }

  onCancel(): void {
    this.resetModal();
    this.cancelled.emit();
  }

  onConfirm(): void {
    if (!this.selectedRoleCode) {
      this.errorMsg.set('Vui lòng chọn role để thêm.');
      return;
    }
    const selected = this.selectedRoleCode;
    this.resetModal();
    this.roleAdded.emit(selected);
  }
}
