import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RequestService } from '@core/services/request.service';
import { PurchasingRequest, RequestStatus, STATUS_CONFIG } from '@core/models/request.models';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-request-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, StatusBadgeComponent],
  template: `
    <!-- Page header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <h1 class="text-2xl font-bold text-slate-900">Yêu cầu mua sắm</h1>
      <a routerLink="/requests/create"
        class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium
               rounded-lg transition-colors duration-200 cursor-pointer">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Tạo yêu cầu mới
      </a>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
      <div class="flex flex-col sm:flex-row gap-3">
        <select [(ngModel)]="filterStatus" (ngModelChange)="loadRequests()"
          class="px-3 py-2 border border-slate-300 rounded-lg text-sm
                 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer">
          <option value="">Tất cả trạng thái</option>
          @for (s of statusOptions; track s.value) {
            <option [value]="s.value">{{ s.label }}</option>
          }
        </select>
        <input type="text" [(ngModel)]="searchQuery" (input)="loadRequests()"
          placeholder="Tìm theo mã hoặc tiêu đề..."
          class="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm
                 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      @if (loading()) {
        <div class="p-8 space-y-3">
          @for (i of [1,2,3,4,5]; track i) {
            <div class="skeleton h-12 w-full"></div>
          }
        </div>
      } @else if (requests().length === 0) {
        <div class="p-12 text-center">
          <svg class="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9.75m3 0h.008v.008h-.008V15zm0 3H9.75m3 0h.008v.008h-.008V18zm-6-6h.008v.008H9.75V12zm0 3h.008v.008H9.75V15zm0 3h.008v.008H9.75V18zM5.625 4.5H9.75m.75-1.5h3m.75 1.5h4.125c.621 0 1.125.504 1.125 1.125v17.25c0 .621-.504 1.125-1.125 1.125h-12.75c-.621 0-1.125-.504-1.125-1.125V5.625c0-.621.504-1.125 1.125-1.125z" />
          </svg>
          <p class="text-sm text-slate-500">Không có yêu cầu nào</p>
        </div>
      } @else {
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-slate-50">
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Mã</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tiêu đề</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Người tạo</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng tiền</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              @for (req of requests(); track req.id) {
                <tr
                  [routerLink]="['/requests', req.id]"
                  class="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer">
                  <td class="px-4 py-3 text-sm font-medium text-blue-600">{{ req.requestNumber }}</td>
                  <td class="px-4 py-3 text-sm text-slate-900">{{ req.title }}</td>
                  <td class="px-4 py-3 text-sm text-slate-600">{{ req.requestedBy }}</td>
                  <td class="px-4 py-3 text-sm text-slate-900 font-medium">
                    {{ req.totalAmount | number:'1.0-0' }} {{ req.currency || 'VND' }}
                  </td>
                  <td class="px-4 py-3">
                    <app-status-badge [status]="req.status" />
                  </td>
                  <td class="px-4 py-3 text-sm text-slate-500">{{ req.requestedDate }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class RequestListComponent implements OnInit {
  requests = signal<PurchasingRequest[]>([]);
  loading = signal(true);
  filterStatus = '';
  searchQuery = '';

  statusOptions = Object.entries(STATUS_CONFIG).map(([value, cfg]) => ({
    value,
    label: cfg.label,
  }));

  constructor(private requestService: RequestService) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.loading.set(true);
    this.requestService
      .getAll({
        status: this.filterStatus || undefined,
        search: this.searchQuery || undefined,
      })
      .subscribe({
        next: (data) => {
          this.requests.set(data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}
