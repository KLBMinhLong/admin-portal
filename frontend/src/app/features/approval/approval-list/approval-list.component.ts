import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApprovalService } from '@core/services/approval.service';
import { PurchasingRequest } from '@core/models/request.models';
import { 
  PageHeaderComponent, CardComponent, SkeletonComponent, 
  EmptyStateComponent, StatusBadgeComponent 
} from '@shared/components';

@Component({
  selector: 'app-approval-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, 
    PageHeaderComponent, CardComponent, SkeletonComponent, 
    EmptyStateComponent, StatusBadgeComponent
  ],
  template: `
    <div class="flex flex-col gap-6">
      <div class="flex items-center justify-between">
        <app-page-header title="Phê duyệt yêu cầu" [description]="requests().length + ' yêu cầu chờ duyệt'" />
      </div>

      @if (loading()) {
        <div class="space-y-4">
          @for (i of [1,2,3]; track i) {
            <app-skeleton variant="card" height="112px" />
          }
        </div>
      } @else if (requests().length === 0) {
        <app-card>
          <div class="p-8 text-center border-t border-slate-100">
            <app-empty-state 
              icon="check-circle" 
              title="Không có yêu cầu chờ duyệt" 
              message="Tất cả yêu cầu đã được xử lý." 
            />
          </div>
        </app-card>
      } @else {
        <div class="space-y-4">
          @for (req of requests(); track req.id) {
            <app-card padding="none">
              <div class="p-5 hover:bg-slate-50/50 transition-colors cursor-pointer"
                [routerLink]="['/approvals', req.id]">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-3 mb-1">
                      <span class="text-sm font-bold text-blue-600">{{ req.requestNumber }}</span>
                      <app-status-badge [status]="req.status" />
                    </div>
                    <h3 class="text-base font-semibold text-slate-900 truncate">{{ req.title }}</h3>
                    <p class="text-sm text-slate-500 mt-1">
                      Người yêu cầu: <strong>{{ req.requestedBy }}</strong> · {{ req.requestedDate }}
                    </p>
                  </div>
                  <div class="text-right shrink-0">
                    <p class="text-lg font-bold text-slate-900">{{ req.totalAmount | number:'1.0-0' }}</p>
                    <p class="text-xs text-slate-400 font-medium">{{ req.currency || 'VND' }}</p>
                  </div>
                </div>
              </div>
            </app-card>
          }
        </div>
      }
    </div>
  `,
})
export class ApprovalListComponent implements OnInit {
  requests = signal<PurchasingRequest[]>([]);
  loading = signal(true);

  private approvalService = inject(ApprovalService);

  ngOnInit(): void {
    this.approvalService.getPendingApprovals().subscribe({
      next: (data) => {
        this.requests.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
