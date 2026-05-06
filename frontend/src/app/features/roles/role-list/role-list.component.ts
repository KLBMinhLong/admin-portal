import { Component, OnInit, signal, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RoleManagementService } from '@core/services/role-management.service';
import { AdminRole } from '@core/models/role.models';
import { ToastService } from '@shared/components/toast/toast.service';
import { 
  PageHeaderComponent, CardComponent, BadgeComponent, IconComponent, 
  ButtonComponent, FormFieldComponent, InputComponent, ModalComponent
} from '@shared/components';
import { RoleFormComponent } from '../components/role-form/role-form.component';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    PageHeaderComponent, CardComponent, BadgeComponent, IconComponent,
    ButtonComponent, FormFieldComponent, InputComponent, ModalComponent,
    RoleFormComponent
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
                    <app-badge [variant]="role.active ? 'success' : 'neutral'">
                      {{ role.active ? 'Đang hoạt động' : 'Vô hiệu hóa' }}
                    </app-badge>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex justify-end gap-2">
                      <app-button variant="secondary" size="sm" (onClick)="openEditModal(role)">Sửa</app-button>
                      <app-button 
                        [variant]="role.active ? 'danger' : 'primary'" 
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
        [open]="showModal()"
        [title]="isEdit() ? 'Cập nhật Role' : 'Thêm Role mới'"
        (closed)="closeModal()"
      >
        <app-role-form 
          [isEdit]="isEdit()" 
          [initialData]="editingRole()" 
          (submitted)="saveRole($event)" 
          (cancelled)="closeModal()" 
          #roleFormComponent 
        />
      </app-modal>
    </div>
  `,
})
export class RoleListComponent implements OnInit {
  roles = signal<AdminRole[]>([]);
  showModal = signal(false);
  isEdit = signal(false);
  editingRole = signal<AdminRole | null>(null);

  @ViewChild('roleFormComponent') roleFormComponent!: RoleFormComponent;

  private roleService = inject(RoleManagementService);
  private toastService = inject(ToastService);

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.roleService.getRoles().subscribe({
      next: (data) => this.roles.set(data || []),
      error: () => this.toastService.error('Không thể tải danh sách Role.')
    });
  }

  openCreateModal(): void {
    this.isEdit.set(false);
    this.editingRole.set(null);
    this.showModal.set(true);
  }

  openEditModal(role: AdminRole): void {
    this.isEdit.set(true);
    this.editingRole.set(role);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveRole(roleData: any): void {
    if (this.roleFormComponent) {
      this.roleFormComponent.setSubmitting(true);
    }

    const currentRole = this.editingRole();

    if (this.isEdit() && currentRole) {
      this.roleService.updateRole(currentRole.id, roleData).subscribe({
        next: () => {
          this.toastService.success('Đã cập nhật Role.');
          this.loadRoles();
          this.closeModal();
          if (this.roleFormComponent) this.roleFormComponent.setSubmitting(false);
        },
        error: () => {
          this.toastService.error('Không thể cập nhật Role.');
          if (this.roleFormComponent) this.roleFormComponent.setSubmitting(false);
        }
      });
    } else {
      this.roleService.createRole(roleData).subscribe({
        next: () => {
          this.toastService.success('Đã thêm Role mới.');
          this.loadRoles();
          this.closeModal();
          if (this.roleFormComponent) this.roleFormComponent.setSubmitting(false);
        },
        error: () => {
          this.toastService.error('Không thể thêm Role mới.');
          if (this.roleFormComponent) this.roleFormComponent.setSubmitting(false);
        }
      });
    }
  }

  toggleActive(role: AdminRole): void {
    this.roleService.toggleRoleActive(role.id).subscribe({
      next: () => {
        this.toastService.success(`Đã ${role.active ? 'vô hiệu hóa' : 'kích hoạt'} Role.`);
        this.loadRoles();
      },
      error: () => this.toastService.error('Không thể thay đổi trạng thái Role.')
    });
  }
}
