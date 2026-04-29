import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RequestService } from '@core/services/request.service';
import { CreateRequestDto } from '@core/models/request.models';
import { HttpErrorResponse } from '@angular/common/http';

const DRAFT_KEY = 'request_draft';

@Component({
  selector: 'app-request-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6">
      <a routerLink="/requests"
        class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
      </a>
      <h1 class="text-2xl font-bold text-slate-900">Tạo yêu cầu mua sắm</h1>
    </div>

    @if (errorMsg()) {
      <div class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700" role="alert">
        {{ errorMsg() }}
      </div>
    }

    @if (successMsg()) {
      <div class="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
        {{ successMsg() }}
      </div>
    }

    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
      <!-- Basic Info Card -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 class="text-base font-semibold text-slate-900 mb-4">Thông tin chung</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label for="create-title" class="block text-sm font-medium text-slate-700 mb-1">
              Tiêu đề <span class="text-red-500">*</span>
            </label>
            <input id="create-title" type="text" formControlName="title"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200"
              placeholder="VD: Mua thiết bị văn phòng Q3/2026" />
            @if (form.get('title')?.touched && form.get('title')?.hasError('required')) {
              <p class="mt-1 text-xs text-red-600">Tiêu đề là bắt buộc</p>
            }
          </div>

          <div class="md:col-span-2">
            <label for="create-desc" class="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
            <textarea id="create-desc" formControlName="description" rows="3"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200 resize-none"
              placeholder="Mô tả chi tiết yêu cầu..."></textarea>
          </div>

          <div>
            <label for="create-cost" class="block text-sm font-medium text-slate-700 mb-1">Mã chi phí</label>
            <input id="create-cost" type="text" formControlName="costCenter"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200"
              placeholder="VD: CC-001" />
          </div>

          <div>
            <label for="create-currency" class="block text-sm font-medium text-slate-700 mb-1">Đơn vị tiền tệ</label>
            <select id="create-currency" formControlName="currency"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer">
              <option value="VND">VND</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Items Card -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-base font-semibold text-slate-900">
            Danh sách hàng hóa <span class="text-xs font-normal text-slate-400">(tối thiểu 1 mục)</span>
          </h2>
          <button type="button" (click)="addItem()"
            class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600
                   border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors duration-200 cursor-pointer">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Thêm mục
          </button>
        </div>

        <div formArrayName="items" class="space-y-4">
          @for (item of itemsArray.controls; track $index; let i = $index) {
            <div [formGroupName]="i" class="border border-slate-200 rounded-lg p-4 relative">
              <button type="button" (click)="removeItem(i)"
                [disabled]="itemsArray.length <= 1"
                class="absolute top-3 right-3 p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer
                       disabled:opacity-30 disabled:cursor-not-allowed">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>

              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pr-8">
                <div class="sm:col-span-2">
                  <label class="block text-xs font-medium text-slate-600 mb-1">Tên hàng hóa *</label>
                  <input type="text" formControlName="itemName"
                    class="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="VD: Laptop Dell Latitude" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1">Số lượng *</label>
                  <input type="number" formControlName="quantity" min="1"
                    class="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1">Đơn giá *</label>
                  <input type="number" formControlName="unitPrice" min="0" step="1000"
                    class="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
                <div class="sm:col-span-2 lg:col-span-4">
                  <label class="block text-xs font-medium text-slate-600 mb-1">Mô tả kỹ thuật</label>
                  <input type="text" formControlName="specification"
                    class="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="VD: RAM 16GB, SSD 512GB" />
                </div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3">
        <a routerLink="/requests"
          class="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300
                 rounded-lg hover:bg-slate-50 transition-colors duration-200 cursor-pointer">
          Hủy bỏ
        </a>
        <button type="submit" [disabled]="submitting()"
          class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium
                 rounded-lg transition-colors duration-200 cursor-pointer
                 disabled:bg-slate-300 disabled:cursor-not-allowed">
          @if (submitting()) {
            Đang tạo...
          } @else {
            Tạo yêu cầu
          }
        </button>
      </div>
    </form>
  `,
})
export class RequestCreateComponent {
  form: FormGroup;
  submitting = signal(false);
  errorMsg = signal('');
  successMsg = signal('');

  constructor(
    private fb: FormBuilder,
    private requestService: RequestService,
    private router: Router,
  ) {
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
      this.errorMsg.set('Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }

    this.submitting.set(true);
    this.errorMsg.set('');

    const dto: CreateRequestDto = this.form.value;

    this.requestService.create(dto).subscribe({
      next: (result) => {
        this.submitting.set(false);
        this.clearDraft();
        this.successMsg.set(`Tạo thành công! Mã yêu cầu: ${result.requestNumber}`);
        setTimeout(() => this.router.navigate(['/requests', result.id]), 1500);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        // A3: Handle idempotent response (409 = đã tạo rồi)
        if (err.status === 409) {
          this.errorMsg.set('Yêu cầu này đã được tạo trước đó. Vui lòng kiểm tra danh sách.');
        } else {
          this.errorMsg.set(err.error?.message || 'Đã xảy ra lỗi khi tạo yêu cầu.');
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
