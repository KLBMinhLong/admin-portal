import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RequestService } from '@core/services/request.service';
import { ApprovalService } from '@core/services/approval.service';
import { PurchasingRequest } from '@core/models/request.models';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-approval-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, StatusBadgeComponent],
  template: `
    @if (loading()) {
      <div class="space-y-4">
        <div class="skeleton h-8 w-64"></div>
        <div class="skeleton h-48 w-full"></div>
      </div>
    } @else if (request()) {
      <!-- Back + Header -->
      <div class="flex items-center gap-4 mb-6">
        <a routerLink="/approvals"
          class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
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

      @if (resultMsg()) {
        <div class="mb-4 p-3 rounded-lg text-sm"
          [class]="resultType() === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'">
          {{ resultMsg() }}
        </div>
      }

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Request info -->
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 class="text-base font-semibold text-slate-900 mb-3">Mô tả</h2>
            <p class="text-sm text-slate-600 whitespace-pre-wrap">{{ request()!.description || 'Không có mô tả.' }}</p>
          </div>

          <!-- Items -->
          <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-200">
              <h2 class="text-base font-semibold text-slate-900">Hàng hóa ({{ request()!.items.length }})</h2>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="bg-slate-50">
                    <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tên</th>
                    <th class="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">SL</th>
                    <th class="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Đơn giá</th>
                    <th class="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of request()!.items; track item.id; let idx = $index) {
                    <tr class="border-b border-slate-100">
                      <td class="px-4 py-3 text-sm text-slate-500">{{ idx + 1 }}</td>
                      <td class="px-4 py-3 text-sm text-slate-900">{{ item.itemName }}</td>
                      <td class="px-4 py-3 text-sm text-slate-900 text-right">{{ item.quantity }}</td>
                      <td class="px-4 py-3 text-sm text-slate-900 text-right">{{ item.unitPrice | number:'1.0-0' }}</td>
                      <td class="px-4 py-3 text-sm font-medium text-slate-900 text-right">{{ item.totalPrice | number:'1.0-0' }}</td>
                    </tr>
                  }
                </tbody>
                <tfoot>
                  <tr class="bg-slate-50">
                    <td colspan="4" class="px-4 py-3 text-sm font-semibold text-slate-900 text-right">Tổng cộng</td>
                    <td class="px-4 py-3 text-sm font-bold text-slate-900 text-right">
                      {{ request()!.totalAmount | number:'1.0-0' }} {{ request()!.currency || 'VND' }}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <!-- Action panel -->
        <div class="space-y-6">
          <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 class="text-sm font-semibold text-slate-900 mb-3">Thông tin</h3>
            <dl class="space-y-3 text-sm">
              <div>
                <dt class="text-slate-500">Người yêu cầu</dt>
                <dd class="text-slate-900 font-medium mt-0.5">{{ request()!.requestedBy }}</dd>
              </div>
              <div>
                <dt class="text-slate-500">Ngày tạo</dt>
                <dd class="text-slate-900 mt-0.5">{{ request()!.requestedDate }}</dd>
              </div>
              <div>
                <dt class="text-slate-500">Tổng tiền</dt>
                <dd class="text-lg font-bold text-slate-900 mt-0.5">{{ request()!.totalAmount | number:'1.0-0' }} {{ request()!.currency || 'VND' }}</dd>
              </div>
            </dl>
          </div>

          <!-- Approval action -->
          @if (request()!.status === 'PENDING_APPROVAL') {
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h3 class="text-sm font-semibold text-slate-900 mb-3">Hành động phê duyệt</h3>

              <div class="mb-4">
                <label for="approval-comment" class="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
                <textarea id="approval-comment" [(ngModel)]="comment" rows="3"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none
                         transition-colors duration-200"
                  placeholder="Nhập ghi chú (bắt buộc khi từ chối)..."></textarea>
              </div>

              <div class="flex gap-3">
                <button (click)="onApprove()" [disabled]="processing()"
                  class="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white text-sm font-medium
                         rounded-lg transition-colors duration-200 cursor-pointer
                         disabled:bg-slate-300 disabled:cursor-not-allowed">
                  @if (processing()) { Đang xử lý... } @else { Duyệt }
                </button>
                <button (click)="onReject()" [disabled]="processing()"
                  class="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white text-sm font-medium
                         rounded-lg transition-colors duration-200 cursor-pointer
                         disabled:bg-slate-300 disabled:cursor-not-allowed">
                  @if (processing()) { Đang xử lý... } @else { Từ chối }
                </button>
              </div>
            </div>
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
  resultMsg = signal('');
  resultType = signal<'success' | 'error'>('success');
  comment = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private requestService: RequestService,
    private approvalService: ApprovalService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.router.navigate(['/approvals']); return; }

    this.requestService.getById(id).subscribe({
      next: (data) => { this.request.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); this.router.navigate(['/approvals']); },
    });
  }

  onApprove(): void {
    this.processing.set(true);
    this.resultMsg.set('');
    this.approvalService.approve(this.request()!.id, this.comment || undefined).subscribe({
      next: (updated) => {
        this.processing.set(false);
        this.request.set(updated);
        this.resultType.set('success');
        this.resultMsg.set('Yêu cầu đã được duyệt thành công!');
      },
      error: (err: HttpErrorResponse) => {
        this.processing.set(false);
        this.resultType.set('error');
        this.resultMsg.set(err.error?.message || 'Lỗi khi duyệt yêu cầu.');
      },
    });
  }

  onReject(): void {
    if (!this.comment.trim()) {
      this.resultType.set('error');
      this.resultMsg.set('Vui lòng nhập lý do từ chối.');
      return;
    }
    this.processing.set(true);
    this.resultMsg.set('');
    this.approvalService.reject(this.request()!.id, this.comment).subscribe({
      next: (updated) => {
        this.processing.set(false);
        this.request.set(updated);
        this.resultType.set('success');
        this.resultMsg.set('Yêu cầu đã bị từ chối.');
      },
      error: (err: HttpErrorResponse) => {
        this.processing.set(false);
        this.resultType.set('error');
        this.resultMsg.set(err.error?.message || 'Lỗi khi từ chối yêu cầu.');
      },
    });
  }
}
