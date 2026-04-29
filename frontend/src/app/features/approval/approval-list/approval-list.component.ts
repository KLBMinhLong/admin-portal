import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApprovalService } from '@core/services/approval.service';
import { PurchasingRequest } from '@core/models/request.models';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-approval-list',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusBadgeComponent],
  template: `
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-slate-900">Phê duyệt yêu cầu</h1>
      <span class="text-sm text-slate-500">{{ requests().length }} yêu cầu chờ duyệt</span>
    </div>

    @if (loading()) {
      <div class="space-y-4">
        @for (i of [1,2,3]; track i) {
          <div class="skeleton h-28 w-full rounded-xl"></div>
        }
      </div>
    } @else if (requests().length === 0) {
      <!-- A1: Empty state -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
        <svg class="w-16 h-16 text-slate-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 class="text-base font-semibold text-slate-900 mb-1">Không có yêu cầu chờ duyệt</h3>
        <p class="text-sm text-slate-500">Tất cả yêu cầu đã được xử lý.</p>
      </div>
    } @else {
      <div class="space-y-4">
        @for (req of requests(); track req.id) {
          <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer"
            [routerLink]="['/approvals', req.id]">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-sm font-semibold text-blue-600">{{ req.requestNumber }}</span>
                  <app-status-badge [status]="req.status" />
                </div>
                <h3 class="text-base font-medium text-slate-900 truncate">{{ req.title }}</h3>
                <p class="text-sm text-slate-500 mt-1">
                  Người yêu cầu: <strong>{{ req.requestedBy }}</strong> · {{ req.requestedDate }}
                </p>
              </div>
              <div class="text-right shrink-0">
                <p class="text-lg font-bold text-slate-900">{{ req.totalAmount | number:'1.0-0' }}</p>
                <p class="text-xs text-slate-400">{{ req.currency || 'VND' }}</p>
              </div>
            </div>
          </div>
        }
      </div>
    }
  `,
})
export class ApprovalListComponent implements OnInit {
  requests = signal<PurchasingRequest[]>([]);
  loading = signal(true);

  constructor(private approvalService: ApprovalService) {}

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
