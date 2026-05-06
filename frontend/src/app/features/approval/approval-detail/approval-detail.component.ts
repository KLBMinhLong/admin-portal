import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RequestService } from '@core/services/request.service';
import { ApprovalService } from '@core/services/approval.service';
import { PurchasingRequest } from '@core/models/request.models';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from '@shared/components/toast/toast.service';
import { 
  CardComponent, ButtonComponent, SkeletonComponent, StatusBadgeComponent,
  FormFieldComponent
} from '@shared/components';

@Component({
  selector: 'app-approval-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink, 
    StatusBadgeComponent, CardComponent, ButtonComponent, 
    SkeletonComponent, FormFieldComponent
  ],
  template: `
    @if (loading()) {
      <div class="space-y-6">
        <app-skeleton variant="text" width="200px" height="32px" />
        <app-skeleton variant="rect" height="300px" />
      </div>
    } @else if (request()) {
      <!-- Back + Header -->
      <div class="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <a routerLink="/approvals"
          class="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 cursor-pointer self-start sm:self-auto">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </a>
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-1">
            <h1 class="text-2xl font-bold text-slate-900">{{ request()!.requestNumber }}</h1>
            <app-status-badge [status]="request()!.status" />
          </div>
          <p class="text-sm text-slate-500">{{ request()!.title }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Request info -->
        <div class="lg:col-span-2 space-y-6">
          <app-card>
            <h2 class="text-base font-semibold text-slate-900 mb-3">Mô tả</h2>
            <p class="text-sm text-slate-600 whitespace-pre-wrap">{{ request()!.description || 'Không có mô tả.' }}</p>
          </app-card>

          <!-- Items -->
          <app-card padding="none">
            <div class="px-6 py-4 border-b border-slate-200 bg-white">
              <h2 class="text-base font-semibold text-slate-900">Hàng hóa ({{ request()!.items.length }})</h2>
            </div>
            <div class="overflow-x-auto bg-white rounded-b-2xl">
              <table class="w-full text-left border-collapse min-w-full divide-y divide-slate-200">
                <thead class="bg-slate-50">
                  <tr>
                    <th class="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                    <th class="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tên</th>
                    <th class="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">SL</th>
                    <th class="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Đơn giá</th>
                    <th class="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Thành tiền</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (item of request()!.items; track item.id; let idx = $index) {
                    <tr class="hover:bg-slate-50/50 transition-colors">
                      <td class="px-6 py-4 text-sm text-slate-500">{{ idx + 1 }}</td>
                      <td class="px-6 py-4">
                        <p class="text-sm font-medium text-slate-900">{{ item.itemName }}</p>
                        @if (item.specification) {
                          <p class="text-xs text-slate-500 mt-0.5">{{ item.specification }}</p>
                        }
                      </td>
                      <td class="px-6 py-4 text-sm text-slate-900 text-right">{{ item.quantity }}</td>
                      <td class="px-6 py-4 text-sm text-slate-900 text-right">{{ item.unitPrice | number:'1.0-0' }}</td>
                      <td class="px-6 py-4 text-sm font-medium text-slate-900 text-right">{{ item.totalPrice | number:'1.0-0' }}</td>
                    </tr>
                  }
                </tbody>
                <tfoot>
                  <tr class="bg-slate-50 border-t border-slate-200">
                    <td colspan="4" class="px-6 py-4 text-sm font-semibold text-slate-900 text-right">Tổng cộng</td>
                    <td class="px-6 py-4 text-sm font-bold text-slate-900 text-right">
                      {{ request()!.totalAmount | number:'1.0-0' }} {{ request()!.currency || 'VND' }}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </app-card>
        </div>

        <!-- Action panel -->
        <div class="space-y-6">
          <app-card>
            <h3 class="text-sm font-semibold text-slate-900 mb-4">Thông tin</h3>
            <dl class="space-y-4 text-sm">
              <div class="flex flex-col">
                <dt class="text-xs font-medium uppercase tracking-wider text-slate-500">Người yêu cầu</dt>
                <dd class="text-slate-900 font-medium mt-1">{{ request()!.requestedBy }}</dd>
              </div>
              <div class="flex flex-col">
                <dt class="text-xs font-medium uppercase tracking-wider text-slate-500">Ngày tạo</dt>
                <dd class="text-slate-900 mt-1">{{ request()!.requestedDate }}</dd>
              </div>
              <div class="flex flex-col pt-2 border-t border-slate-100">
                <dt class="text-xs font-medium uppercase tracking-wider text-slate-500">Tổng tiền</dt>
                <dd class="text-xl font-bold text-slate-900 mt-1">
                  {{ request()!.totalAmount | number:'1.0-0' }} <span class="text-sm font-medium text-slate-500">{{ request()!.currency || 'VND' }}</span>
                </dd>
              </div>
            </dl>
          </app-card>

          <!-- Approval action -->
          @if (request()!.status === 'PENDING_APPROVAL') {
            <app-card>
              <h3 class="text-sm font-semibold text-slate-900 mb-4">Hành động phê duyệt</h3>

              <div class="mb-5">
                <app-form-field label="Ghi chú" fieldId="approval-comment">
                  <textarea id="approval-comment" [(ngModel)]="comment" rows="3"
                    class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none
                           transition-colors duration-200"
                    placeholder="Nhập ghi chú (bắt buộc khi từ chối)..."></textarea>
                </app-form-field>
              </div>

              <div class="flex flex-col sm:flex-row gap-3">
                <app-button 
                  variant="primary" 
                  icon="check-circle"
                  class="flex-1"
                  [loading]="processing()" 
                  (onClick)="onApprove()"
                >
                  Duyệt
                </app-button>
                <app-button 
                  variant="danger" 
                  icon="x-circle"
                  class="flex-1"
                  [loading]="processing()" 
                  (onClick)="onReject()"
                >
                  Từ chối
                </app-button>
              </div>
            </app-card>
          }
        </div>
      </div>
    }
  `,
})
export class ApprovalDetailComponent implements OnInit {
  request = signal<PurchasingRequest | null>(null);
  loading = signal(true);
  processing = signal(false);
  comment = '';

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private requestService = inject(RequestService);
  private approvalService = inject(ApprovalService);
  private toastService = inject(ToastService);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.router.navigate(['/approvals']); return; }

    this.requestService.getById(id).subscribe({
      next: (data) => { this.request.set(data); this.loading.set(false); },
      error: () => { 
        this.loading.set(false); 
        this.toastService.error('Không thể tải chi tiết phê duyệt.');
        this.router.navigate(['/approvals']); 
      },
    });
  }

  onApprove(): void {
    this.processing.set(true);
    this.approvalService.approve(this.request()!.id, this.comment || undefined).subscribe({
      next: (updated) => {
        this.processing.set(false);
        this.request.set(updated);
        this.toastService.success('Yêu cầu đã được duyệt thành công!');
      },
      error: (err: HttpErrorResponse) => {
        this.processing.set(false);
        this.toastService.error(err.error?.message || 'Lỗi khi duyệt yêu cầu.');
      },
    });
  }

  onReject(): void {
    if (!this.comment.trim()) {
      this.toastService.error('Vui lòng nhập lý do từ chối.');
      return;
    }
    this.processing.set(true);
    this.approvalService.reject(this.request()!.id, this.comment).subscribe({
      next: (updated) => {
        this.processing.set(false);
        this.request.set(updated);
        this.toastService.success('Yêu cầu đã bị từ chối.');
      },
      error: (err: HttpErrorResponse) => {
        this.processing.set(false);
        this.toastService.error(err.error?.message || 'Lỗi khi từ chối yêu cầu.');
      },
    });
  }
}
