import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RequestService } from '@core/services/request.service';
import { PurchasingRequest, STATUS_CONFIG } from '@core/models/request.models';
import { 
  PageHeaderComponent, CardComponent, ButtonComponent, 
  SelectComponent, SearchBarComponent, SkeletonComponent,
  EmptyStateComponent, StatusBadgeComponent, SelectOption
} from '@shared/components';

@Component({
  selector: 'app-request-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule, 
    PageHeaderComponent, CardComponent, ButtonComponent, 
    SelectComponent, SearchBarComponent, SkeletonComponent,
    EmptyStateComponent, StatusBadgeComponent
  ],
  template: `
    <div class="flex flex-col gap-6">
      <app-page-header title="Yêu cầu mua sắm">
        <div actions>
          <app-button variant="primary" icon="plus" routerLink="/requests/create">
            Tạo yêu cầu mới
          </app-button>
        </div>
      </app-page-header>

      <!-- Filters -->
      <app-card>
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="w-full sm:w-64">
            <app-select 
              [options]="statusOptions" 
              [(ngModel)]="filterStatus" 
              (ngModelChange)="loadRequests()"
              placeholder="Tất cả trạng thái"
            />
          </div>
          <div class="flex-1">
            <app-search-bar 
              [(ngModel)]="searchQuery" 
              (search)="loadRequests()"
              placeholder="Tìm theo mã hoặc tiêu đề..."
            />
          </div>
        </div>
      </app-card>

      <!-- Table -->
      <app-card padding="none">
        @if (loading()) {
          <app-skeleton variant="table-row" [rows]="5" [cols]="6" />
        } @else if (requests().length === 0) {
          <div class="p-8 text-center border-t border-slate-100">
            <app-empty-state 
              icon="document-text" 
              title="Không có yêu cầu nào" 
              message="Thử thay đổi bộ lọc hoặc tạo yêu cầu mới." 
            />
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse min-w-full divide-y divide-slate-200">
              <thead class="bg-slate-50">
                <tr>
                  <th class="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Mã</th>
                  <th class="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tiêu đề</th>
                  <th class="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Người tạo</th>
                  <th class="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Tổng tiền</th>
                  <th class="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                  <th class="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ngày tạo</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 bg-white">
                @for (req of requests(); track req.id) {
                  <tr
                    [routerLink]="['/requests', req.id]"
                    class="hover:bg-slate-50/50 transition-colors cursor-pointer">
                    <td class="px-6 py-4 text-sm font-medium text-blue-600">{{ req.requestNumber }}</td>
                    <td class="px-6 py-4 text-sm text-slate-900">{{ req.title }}</td>
                    <td class="px-6 py-4 text-sm text-slate-600">{{ req.requestedBy }}</td>
                    <td class="px-6 py-4 text-sm font-medium text-slate-900 text-right">
                      {{ req.totalAmount | number:'1.0-0' }} {{ req.currency || 'VND' }}
                    </td>
                    <td class="px-6 py-4">
                      <app-status-badge [status]="req.status" />
                    </td>
                    <td class="px-6 py-4 text-sm text-slate-500">{{ req.requestedDate }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </app-card>
    </div>
  `,
})
export class RequestListComponent implements OnInit {
  requests = signal<PurchasingRequest[]>([]);
  loading = signal(true);
  filterStatus = '';
  searchQuery = '';

  statusOptions: SelectOption[] = Object.entries(STATUS_CONFIG).map(([value, cfg]) => ({
    value,
    label: cfg.label,
  }));

  private requestService = inject(RequestService);

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
