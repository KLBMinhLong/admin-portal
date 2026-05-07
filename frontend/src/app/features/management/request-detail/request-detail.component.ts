import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RequestService } from '@core/services/request.service';
import { PurchasingRequest } from '@core/models/request.models';
import { RequestStepperComponent } from '../components/request-stepper/request-stepper.component';
import { RequestCommentsComponent } from '../components/request-comments/request-comments.component';
import { ToastService } from '@shared/components/toast/toast.service';
import { 
  CardComponent, ButtonComponent, SkeletonComponent, StatusBadgeComponent 
} from '@shared/components';

@Component({
  selector: 'app-request-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, 
    StatusBadgeComponent, RequestStepperComponent, RequestCommentsComponent,
    CardComponent, ButtonComponent, SkeletonComponent
  ],
  template: `
    @if (loading()) {
      <div class="space-y-6">
        <app-skeleton variant="text" width="200px" height="32px" />
        <app-skeleton variant="rect" height="150px" />
        <app-skeleton variant="rect" height="300px" />
      </div>
    } @else if (request()) {
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
        <a routerLink="/requests"
          class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer self-start">
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
        @if (request()!.status === 'DRAFT') {
          <app-button 
            variant="primary" 
            [loading]="submitting()" 
            (click)="submitRequest()">
            Gửi phê duyệt
          </app-button>
        }
      </div>

      <!-- Stepper UI -->
      <div class="mb-6 px-2 sm:px-8">
        <app-request-stepper [currentStatus]="request()!.status" />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main info -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Description -->
          <app-card>
            <h2 class="text-base font-semibold text-slate-900 mb-3">Mô tả</h2>
            <p class="text-sm text-slate-600 whitespace-pre-wrap">{{ request()!.description || 'Không có mô tả.' }}</p>
          </app-card>

          <!-- Items table -->
          <app-card padding="none">
            <div class="px-6 py-4 border-b border-slate-200 bg-white">
              <h2 class="text-base font-semibold text-slate-900">Danh sách hàng hóa ({{ request()!.items.length || 0 }})</h2>
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

          <!-- Comments Thread -->
          <app-request-comments [requestId]="request()!.id" />
        </div>

        <!-- Sidebar info -->
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
              <div class="flex flex-col">
                <dt class="text-xs font-medium uppercase tracking-wider text-slate-500">Mã chi phí</dt>
                <dd class="text-slate-900 mt-1">{{ request()!.costCenter || '—' }}</dd>
              </div>
              <div class="flex flex-col">
                <dt class="text-xs font-medium uppercase tracking-wider text-slate-500">Đơn vị tiền tệ</dt>
                <dd class="text-slate-900 mt-1">{{ request()!.currency || 'VND' }}</dd>
              </div>
            </dl>
          </app-card>

          <!-- Approval steps (Historical logs) -->
          @if (request()!.approvalSteps.length) {
            <app-card>
              <h3 class="text-sm font-semibold text-slate-900 mb-4">Lịch sử phê duyệt</h3>
              <div class="space-y-3">
                @for (step of request()!.approvalSteps; track step.id) {
                  <div class="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between mb-1">
                        <p class="text-sm font-medium text-slate-900 truncate">{{ step.roleName }}</p>
                        <app-status-badge [status]="$any(step.status)" />
                      </div>
                      <p class="text-xs text-slate-500">{{ step.approver || 'Chưa xử lý' }}</p>
                      @if (step.comment) {
                        <p class="text-xs text-slate-600 mt-1.5 italic">"{{ step.comment }}"</p>
                      }
                    </div>
                  </div>
                }
              </div>
            </app-card>
          }
        </div>
      </div>
    }
  `,
})
export class RequestDetailComponent implements OnInit {
  request = signal<PurchasingRequest | null>(null);
  loading = signal(true);
  submitting = signal(false);

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private requestService = inject(RequestService);
  private toastService = inject(ToastService);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.router.navigate(['/requests']);
      return;
    }
    this.requestService.getById(id).subscribe({
      next: (data) => {
        this.request.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toastService.error('Không thể tải chi tiết yêu cầu.');
        this.router.navigate(['/requests']);
      },
    });
  }

  submitRequest(): void {
    const req = this.request();
    if (!req) return;

    this.submitting.set(true);
    this.requestService.submit(req.id).subscribe({
      next: (updated) => {
        this.submitting.set(false);
        this.request.set(updated);
        this.toastService.success('Yêu cầu đã được gửi phê duyệt thành công!');
      },
      error: () => {
        this.submitting.set(false);
        this.toastService.error('Không thể gửi yêu cầu phê duyệt.');
      },
    });
  }
}
