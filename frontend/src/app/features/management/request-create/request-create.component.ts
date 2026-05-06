import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RequestService } from '@core/services/request.service';
import { CreateRequestDto } from '@core/models/request.models';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from '@shared/components/toast/toast.service';
import { 
  PageHeaderComponent, CardComponent, ButtonComponent, 
  FormFieldComponent, InputComponent, SelectComponent, SelectOption
} from '@shared/components';

const DRAFT_KEY = 'request_draft';

@Component({
  selector: 'app-request-create',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    PageHeaderComponent, CardComponent, ButtonComponent,
    FormFieldComponent, InputComponent, SelectComponent
  ],
  template: `
    <div class="flex flex-col gap-6">
      <div class="flex items-center gap-4">
        <a routerLink="/requests"
          class="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 cursor-pointer">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </a>
        <h1 class="text-2xl font-bold text-slate-900">Tạo yêu cầu mua sắm</h1>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
        <!-- Basic Info Card -->
        <app-card>
          <h2 class="text-base font-semibold text-slate-900 mb-4">Thông tin chung</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <app-form-field label="Tiêu đề" fieldId="create-title" [required]="true" [error]="getFieldError('title')">
                <app-input formControlName="title" placeholder="VD: Mua thiết bị văn phòng Q3/2026" [hasError]="hasFieldError('title')" />
              </app-form-field>
            </div>

            <div class="md:col-span-2">
              <app-form-field label="Mô tả" fieldId="create-desc">
                <textarea formControlName="description" rows="3" placeholder="Mô tả chi tiết yêu cầu..."
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none transition-colors duration-200 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                </textarea>
              </app-form-field>
            </div>

            <div>
              <app-form-field label="Mã chi phí" fieldId="create-cost">
                <app-input formControlName="costCenter" placeholder="VD: CC-001" />
              </app-form-field>
            </div>

            <div>
              <app-form-field label="Đơn vị tiền tệ" fieldId="create-currency">
                <app-select formControlName="currency" [options]="currencyOptions" />
              </app-form-field>
            </div>
          </div>
        </app-card>

        <!-- Items Card -->
        <app-card>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-base font-semibold text-slate-900">
              Danh sách hàng hóa <span class="text-xs font-normal text-slate-400">(tối thiểu 1 mục)</span>
            </h2>
            <app-button type="button" variant="secondary" size="sm" icon="plus" (onClick)="addItem()">
              Thêm mục
            </app-button>
          </div>

          <div formArrayName="items" class="space-y-4">
            @for (item of itemsArray.controls; track $index; let i = $index) {
              <div [formGroupName]="i" class="border border-slate-200 rounded-lg p-4 relative bg-slate-50/50">
                <button type="button" (click)="removeItem(i)"
                  [disabled]="itemsArray.length <= 1"
                  class="absolute top-3 right-3 p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pr-8">
                  <div class="sm:col-span-2">
                    <label class="block text-xs font-medium text-slate-600 mb-1">Tên hàng hóa *</label>
                    <app-input formControlName="itemName" placeholder="VD: Laptop Dell Latitude" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-slate-600 mb-1">Số lượng *</label>
                    <app-input type="number" formControlName="quantity" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-slate-600 mb-1">Đơn giá *</label>
                    <app-input type="number" formControlName="unitPrice" />
                  </div>
                  <div class="sm:col-span-2 lg:col-span-4">
                    <label class="block text-xs font-medium text-slate-600 mb-1">Mô tả kỹ thuật</label>
                    <app-input formControlName="specification" placeholder="VD: RAM 16GB, SSD 512GB" />
                  </div>
                </div>
              </div>
            }
          </div>
        </app-card>

        <!-- Actions -->
        <div class="flex justify-end gap-3">
          <a routerLink="/requests"
            class="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors duration-200 cursor-pointer">
            Hủy bỏ
          </a>
          <app-button type="submit" variant="primary" [loading]="submitting()" [disabled]="form.invalid && form.touched">
            Tạo yêu cầu
          </app-button>
        </div>
      </form>
    </div>
  `,
})
export class RequestCreateComponent {
  form: FormGroup;
  submitting = signal(false);

  currencyOptions: SelectOption[] = [
    { value: 'VND', label: 'VND' },
    { value: 'USD', label: 'USD' }
  ];

  private fb = inject(FormBuilder);
  private requestService = inject(RequestService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  constructor() {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', Validators.maxLength(2000)],
      costCenter: ['', Validators.maxLength(50)],
      currency: ['VND'],
      items: this.fb.array([this.createItemGroup()]),
    });

    // Edge Case: Restore draft từ localStorage nếu có
    this.restoreDraft();

    // Auto-save draft khi thay đổi (mất mạng giữa chừng)
    this.form.valueChanges.subscribe(() => this.saveDraft());
  }

  get itemsArray(): FormArray {
    return this.form.get('items') as FormArray;
  }

  hasFieldError(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getFieldError(field: string): string {
    const control = this.form.get(field);
    if (!control || !control.errors || (!control.dirty && !control.touched)) return '';
    if (control.errors['required']) return 'Trường này là bắt buộc';
    return 'Dữ liệu không hợp lệ';
  }

  addItem(): void {
    this.itemsArray.push(this.createItemGroup());
  }

  removeItem(index: number): void {
    if (this.itemsArray.length > 1) {
      this.itemsArray.removeAt(index);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastService.error('Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }

    this.submitting.set(true);

    const dto: CreateRequestDto = this.form.value;

    this.requestService.create(dto).subscribe({
      next: (result) => {
        this.submitting.set(false);
        this.clearDraft();
        this.toastService.success(`Tạo thành công! Mã yêu cầu: ${result.requestNumber}`);
        setTimeout(() => this.router.navigate(['/requests', result.id]), 1500);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        // A3: Handle idempotent response (409 = đã tạo rồi)
        if (err.status === 409) {
          this.toastService.error('Yêu cầu này đã được tạo trước đó. Vui lòng kiểm tra danh sách.');
        } else {
          this.toastService.error(err.error?.message || 'Đã xảy ra lỗi khi tạo yêu cầu.');
        }
      },
    });
  }

  private createItemGroup(): FormGroup {
    return this.fb.group({
      itemCode: [''],
      itemName: ['', [Validators.required, Validators.maxLength(200)]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      specification: ['', Validators.maxLength(2000)],
    });
  }

  /* ─── Draft persistence (Edge Case: mất mạng giữa chừng) ─── */

  private saveDraft(): void {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(this.form.value));
    } catch { /* quota exceeded, ignore */ }
  }

  private restoreDraft(): void {
    try {
      const draft = sessionStorage.getItem(DRAFT_KEY);
      if (draft) {
        const data = JSON.parse(draft);
        this.form.patchValue({ title: data.title, description: data.description, costCenter: data.costCenter, currency: data.currency });
        // Restore items
        if (data.items?.length > 0) {
          this.itemsArray.clear();
          data.items.forEach((item: any) => {
            const group = this.createItemGroup();
            group.patchValue(item);
            this.itemsArray.push(group);
          });
        }
      }
    } catch { /* corrupted draft, ignore */ }
  }

  private clearDraft(): void {
    sessionStorage.removeItem(DRAFT_KEY);
  }
}
