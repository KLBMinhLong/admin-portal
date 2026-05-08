import { Component, OnInit, signal, computed, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { DashboardService, DashboardData } from '../../core/services/dashboard.service';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { StatCardComponent } from '@shared/components/stat-card/stat-card.component';
import { CardComponent } from '@shared/components/card/card.component';
import { DataTableComponent } from '@shared/components/data-table/data-table.component';
import { TableColumn } from '@shared/components/data-table/data-table.models';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';

/**
 * Dashboard page — Smart Component.
 * Hiển thị KPI stats, charts, top pending requests.
 * UI delegate cho shared Dumb Components (stat-card, card, data-table).
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, BaseChartDirective,
    PageHeaderComponent, StatCardComponent, CardComponent,
    DataTableComponent, EmptyStateComponent,
  ],
  template: `
    <app-page-header
      title="Dashboard thống kê"
      subtitle="Overview"
      description="Tổng quan hoạt động mua sắm và phê duyệt."
    />

    <!-- Stat cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6 mb-6">
      <app-stat-card
        label="Tổng yêu cầu"
        [value]="totalRequests()"
      />
      <app-stat-card
        label="Chờ duyệt"
        [value]="pendingRequests()"
        accentColor="border-l-amber-500"
        valueColor="text-amber-600"
      />
      <app-stat-card
        label="Đã duyệt"
        [value]="approvedRequests()"
        accentColor="border-l-green-500"
        valueColor="text-green-600"
      />
      <app-stat-card
        label="Từ chối"
        [value]="rejectedRequests()"
        accentColor="border-l-red-500"
        valueColor="text-red-600"
      />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- Pie Chart -->
      <app-card padding="lg">
        <h2 class="text-base font-semibold text-slate-900 mb-4">Trạng thái yêu cầu</h2>
        <div class="aspect-square flex items-center justify-center">
          <canvas baseChart
                  [data]="pieChartData()"
                  [type]="pieChartType"
                  [options]="pieChartOptions">
          </canvas>
        </div>
      </app-card>

      <!-- Bar Chart -->
      <div class="lg:col-span-2">
        <app-card padding="lg">
          <h2 class="text-base font-semibold text-slate-900 mb-4">Tổng chi phí mua sắm theo tháng (VND)</h2>
          <div class="w-full h-72">
            <canvas baseChart
                    [data]="barChartData()"
                    [type]="barChartType"
                    [options]="barChartOptions">
            </canvas>
          </div>
        </app-card>
      </div>
    </div>

    <!-- Leaderboard Table -->
    <app-card padding="none">
      <div cardHeader class="px-6 py-4 border-b border-slate-100 bg-slate-50">
        <h2 class="text-base font-semibold text-slate-900">
          Top 5 yêu cầu đang chờ duyệt có giá trị cao nhất
        </h2>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-white border-b border-slate-100">
              <th class="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Mã yêu cầu</th>
              <th class="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Người tạo</th>
              <th class="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ngày tạo</th>
              <th class="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Tổng giá trị</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 bg-white">
            @for (req of topRequests(); track req.requestNumber; let i = $index) {
              <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center gap-3">
                    <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                          [ngClass]="getRankClass(i)">
                      {{ i + 1 }}
                    </span>
                    <span class="text-sm font-medium text-slate-900">{{ req.requestNumber }}</span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{{ req.requestedBy }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{{ req.requestedDate | date:'mediumDate' }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 text-right">{{ req.totalAmount | number:'1.0-0' }}</td>
              </tr>
            } @empty {
              <tr>
                <td colspan="4">
                  <app-empty-state
                    icon="file-text"
                    title="Không có yêu cầu nào đang chờ duyệt"
                  />
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </app-card>
  `,
})
export class DashboardComponent implements OnInit {
  data = signal<DashboardData | null>(null);

  // Computeds cho stat cards
  pendingRequests = computed(() => this.data()?.requestsByStatus['PENDING_APPROVAL'] || 0);
  approvedRequests = computed(() => this.data()?.requestsByStatus['APPROVED'] || 0);
  rejectedRequests = computed(() => this.data()?.requestsByStatus['REJECTED'] || 0);
  totalRequests = computed(() => {
    const stats = this.data()?.requestsByStatus;
    if (!stats || typeof stats !== 'object') return 0;
    return Object.values(stats).reduce((a, b) => (Number(a) || 0) + (Number(b) || 0), 0);
  });
  topRequests = computed(() => this.data()?.topPendingRequests || []);

  // Pie Chart config (Signal)
  pieChartType: ChartType = 'pie';
  pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' }
    }
  };
  pieChartData = signal<ChartData<'pie'>>({
    labels: ['Chờ duyệt', 'Đã duyệt', 'Từ chối', 'Khác'],
    datasets: [{
      data: [0, 0, 0, 0],
      backgroundColor: ['#f59e0b', '#22c55e', '#ef4444', '#94a3b8'],
      borderWidth: 0
    }]
  });

  // Bar Chart config (Signal)
  barChartType: ChartType = 'bar';
  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };
  barChartData = signal<ChartData<'bar'>>({
    labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
    datasets: [
      { data: Array(12).fill(0), label: 'Tổng chi phí', backgroundColor: '#3b82f6', borderRadius: 4, hoverBackgroundColor: '#2563eb' }
    ]
  });

  constructor(private dashboardService: DashboardService) { }

  ngOnInit(): void {
    this.dashboardService.getDashboardData().subscribe({
      next: (res) => {
        console.log('[Dashboard] Data received:', res);
        if (res) {
          this.data.set(res);
          this.updateCharts(res);
        }
      },
      error: (err) => {
        console.error('[Dashboard] Failed to load data:', err);
      }
    });
  }

  /** CSS class cho ranking badge theo vị trí */
  getRankClass(index: number): string {
    const classes = [
      'bg-amber-100 text-amber-700',
      'bg-slate-200 text-slate-600',
      'bg-orange-100 text-orange-700',
    ];
    return classes[index] || 'bg-blue-50 text-blue-600';
  }

  updateCharts(res: DashboardData) {
    if (!res) return;

    // Cập nhật Pie Chart
    const stats = res.requestsByStatus || {};
    const pending = stats['PENDING_APPROVAL'] || 0;
    const approved = stats['APPROVED'] || 0;
    const rejected = stats['REJECTED'] || 0;
    const total = Object.values(stats).reduce((a, b) => (Number(a) || 0) + (Number(b) || 0), 0);
    const other = total - pending - approved - rejected;

    this.pieChartData.set({
      labels: ['Chờ duyệt', 'Đã duyệt', 'Từ chối', 'Khác'],
      datasets: [{
        data: [pending, approved, rejected, other],
        backgroundColor: ['#f59e0b', '#22c55e', '#ef4444', '#94a3b8'],
        borderWidth: 0
      }]
    });

    // Cập nhật Bar Chart
    const monthlyData = res.monthlyCosts.map(m => m.totalCost);
    this.barChartData.set({
      labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
      datasets: [
        { data: monthlyData, label: 'Tổng chi phí', backgroundColor: '#3b82f6', borderRadius: 4, hoverBackgroundColor: '#2563eb' }
      ]
    });
  }
}
