import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RoleManagementService } from '@core/services/role-management.service';
import { AdminRole } from '@core/models/role.models';
import { ToastService } from '@shared/components/toast/toast.service';
import { 
  PageHeaderComponent, CardComponent, BadgeComponent, IconComponent, 
  ButtonComponent, FormFieldComponent, InputComponent, ModalComponent
} from '@shared/components';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    PageHeaderComponent, CardComponent, BadgeComponent, IconComponent,
    ButtonComponent, FormFieldComponent, InputComponent, ModalComponent
  ],
  template: `
    <div class="flex flex-col gap-6">
      <app-page-header
        title="Danh sách Role"
        description="Quản lý các chức danh và vai trò trong hệ thống"
      >
        <div actions>
          <app-button variant="primary" icon="plus" (onClick)="openCreateModal()">
            Thêm Role mới
          </app-button>
        </div>
      </app-page-header>

      <app-card padding="none">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Mã Role</th>
                <th class="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tên hiển thị</th>
                <th class="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                <th class="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              @for (role of roles(); track role.id) {
                <tr class="hover:bg-slate-50/50 transition-colors">
                  <td class="px-6 py-4">
                    <code class="text-xs font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded">{{ role.code }}</code>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-sm font-medium text-slate-900">{{ role.name }}</div>
                    <div class="text-xs text-slate-500 mt-1">{{ role.description }}</div>
                  </td>
                  <td class="px-6 py-4">
                    <app-badge [variant]="role.active ? 'success' : 'default'">
                      {{ role.active ? 'Đang hoạt động' : 'Vô hiệu hóa' }}
                    </app-badge>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex justify-end gap-2">
                      <app-button variant="secondary" size="sm" (onClick)="openEditModal(role)">Sửa</app-button>
                      <app-button 
                        [variant]="role.active ? 'danger' : 'success'" 
                        size="sm" 
                        (onClick)="toggleActive(role)"
                      >
                        {{ role.active ? 'Vô hiệu hóa' : 'Kích hoạt' }}
                      </app-button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="px-6 py-8 text-center text-sm text-slate-500">
                    Không có dữ liệu Role.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </app-card>

      <!-- Modal Add/Edit -->
      <app-modal
        [isOpen]="showModal()"
        [title]="isEdit() ? 'Cập nhật Role' : 'Thêm Role mới'"
        (closed)="closeModal()"
      >
        <form [formGroup]="roleForm" (ngSubmit)="saveRole()">
          <div class="space-y-4">
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
          </div>
          
          <div class="mt-6 flex justify-end gap-3">
            <app-button type="button" variant="secondary" (onClick)="closeModal()">Hủy</app-button>
            <app-button type="submit" variant="primary" [disabled]="roleForm.invalid">
              Lưu thông tin
            </app-button>
          </div>
        </form>
      </app-modal>
    </div>
  `,
})
export class RoleListComponent implements OnInit {
  roles = signal<AdminRole[]>([]);
  showModal = signal(false);
  isEdit = signal(false);
  editingRoleId: number | null = null;
  
  roleForm: FormGroup;

  private fb = inject(FormBuilder);
  private roleService = inject(RoleManagementService);
  private toastService = inject(ToastService);

  constructor() {
    this.roleForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern('^[A-Z0-9_]+$')]],
      name: ['', Validators.required],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.roleService.getRoles().subscribe({
      next: (data) => this.roles.set(data || []),
      error: () => this.toastService.error('Lỗi', 'Không thể tải danh sách Role.')
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

  openCreateModal(): void {
    this.isEdit.set(false);
    this.editingRoleId = null;
    this.roleForm.reset();
    this.roleForm.get('code')?.enable();
    this.showModal.set(true);
  }

  openEditModal(role: AdminRole): void {
    this.isEdit.set(true);
    this.editingRoleId = role.id;
    this.roleForm.patchValue({
      code: role.code,
      name: role.name,
      description: role.description
    });
    this.roleForm.get('code')?.disable();
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveRole(): void {
    if (this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();
      return;
    }

    const roleData = this.roleForm.getRawValue();

    if (this.isEdit() && this.editingRoleId) {
      this.roleService.updateRole(this.editingRoleId, roleData).subscribe({
        next: () => {
          this.toastService.success('Thành công', 'Đã cập nhật Role.');
          this.loadRoles();
          this.closeModal();
        },
        error: () => this.toastService.error('Lỗi', 'Không thể cập nhật Role.')
      });
    } else {
      this.roleService.createRole(roleData).subscribe({
        next: () => {
          this.toastService.success('Thành công', 'Đã thêm Role mới.');
          this.loadRoles();
          this.closeModal();
        },
        error: () => this.toastService.error('Lỗi', 'Không thể thêm Role mới.')
      });
    }
  }

  toggleActive(role: AdminRole): void {
    this.roleService.toggleRoleActive(role.id).subscribe({
      next: () => {
        this.toastService.success('Thành công', `Đã ${role.active ? 'vô hiệu hóa' : 'kích hoạt'} Role.`);
        this.loadRoles();
      },
      error: () => this.toastService.error('Lỗi', 'Không thể thay đổi trạng thái Role.')
    });
  }
}
