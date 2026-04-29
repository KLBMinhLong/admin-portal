import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { DashboardService, DashboardData } from './dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <h1 class="text-2xl font-bold text-slate-900 mb-6">Dashboard thống kê</h1>

    <!-- Stat cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5 transition-all hover:shadow-md">
        <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Tổng yêu cầu</p>
        <p class="text-2xl font-bold text-slate-900">{{ totalRequests() }}</p>
      </div>
      <div class="bg-white rounded-xl border-l-4 border-l-amber-500 border border-slate-200 shadow-sm p-5 transition-all hover:shadow-md">
        <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Chờ duyệt</p>
        <p class="text-2xl font-bold text-amber-600">{{ pendingRequests() }}</p>
      </div>
      <div class="bg-white rounded-xl border-l-4 border-l-green-500 border border-slate-200 shadow-sm p-5 transition-all hover:shadow-md">
        <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Đã duyệt</p>
        <p class="text-2xl font-bold text-green-600">{{ approvedRequests() }}</p>
      </div>
      <div class="bg-white rounded-xl border-l-4 border-l-red-500 border border-slate-200 shadow-sm p-5 transition-all hover:shadow-md">
        <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Từ chối</p>
        <p class="text-2xl font-bold text-red-600">{{ rejectedRequests() }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- Pie Chart -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 lg:col-span-1">
        <h2 class="text-base font-semibold text-slate-900 mb-4">Trạng thái yêu cầu</h2>
        <div class="aspect-square flex items-center justify-center">
          <canvas baseChart
                  [data]="pieChartData"
                  [type]="pieChartType"
                  [options]="pieChartOptions">
          </canvas>
        </div>
      </div>

      <!-- Bar Chart -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 lg:col-span-2">
        <h2 class="text-base font-semibold text-slate-900 mb-4">Tổng chi phí mua sắm theo tháng (VND)</h2>
        <div class="w-full h-72">
          <canvas baseChart
                  [data]="barChartData"
                  [type]="barChartType"
                  [options]="barChartOptions">
          </canvas>
        </div>
      </div>
    </div>

    <!-- Leaderboard -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <h2 class="text-base font-semibold text-slate-900">Top 5 yêu cầu đang chờ duyệt có giá trị cao nhất</h2>
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
                          [ngClass]="i === 0 ? 'bg-amber-100 text-amber-700' : (i === 1 ? 'bg-slate-200 text-slate-600' : (i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-blue-50 text-blue-600'))">
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
                <td colspan="4" class="px-6 py-8 text-center text-sm text-slate-500">Không có yêu cầu nào đang chờ duyệt.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  data = signal<DashboardData | null>(null);

  // Computeds cho stat cards
  pendingRequests = computed(() => this.data()?.requestsByStatus['PENDING_APPROVAL'] || 0);
  approvedRequests = computed(() => this.data()?.requestsByStatus['APPROVED'] || 0);
  rejectedRequests = computed(() => this.data()?.requestsByStatus['REJECTED'] || 0);
  totalRequests = computed(() => {
    const stats = this.data()?.requestsByStatus;
    if (!stats) return 0;
    return Object.values(stats).reduce((a, b) => a + b, 0);
  });
  topRequests = computed(() => this.data()?.topPendingRequests || []);

  // Pie Chart config
  pieChartType: ChartType = 'pie';
  pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' }
    }
  };
  pieChartData: ChartData<'pie', number[], string | string[]> = {
    labels: ['Chờ duyệt', 'Đã duyệt', 'Từ chối', 'Khác'],
    datasets: [{
      data: [0, 0, 0, 0],
      backgroundColor: ['#f59e0b', '#22c55e', '#ef4444', '#94a3b8'], // amber-500, green-500, red-500, slate-400
      borderWidth: 0
    }]
  };

  // Bar Chart config
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
  barChartData: ChartData<'bar'> = {
    labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
    datasets: [
      { data: [], label: 'Tổng chi phí', backgroundColor: '#3b82f6', borderRadius: 4, hoverBackgroundColor: '#2563eb' }
    ]
  };

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.dashboardService.getDashboardData().subscribe(res => {
      this.data.set(res);
      this.updateCharts(res);
    });
  }

  updateCharts(res: DashboardData) {
    // Cập nhật Pie Chart
    const pending = res.requestsByStatus['PENDING_APPROVAL'] || 0;
    const approved = res.requestsByStatus['APPROVED'] || 0;
    const rejected = res.requestsByStatus['REJECTED'] || 0;
    let total = Object.values(res.requestsByStatus).reduce((a, b) => a + b, 0);
    const other = total - pending - approved - rejected;

    this.pieChartData = {
      labels: ['Chờ duyệt', 'Đã duyệt', 'Từ chối', 'Khác'],
      datasets: [{
        data: [pending, approved, rejected, other],
        backgroundColor: ['#f59e0b', '#22c55e', '#ef4444', '#94a3b8'],
        borderWidth: 0
      }]
    };

    // Cập nhật Bar Chart
    const monthlyData = res.monthlyCosts.map(m => m.totalCost);
    this.barChartData = {
      labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
      datasets: [
        { data: monthlyData, label: 'Tổng chi phí', backgroundColor: '#3b82f6', borderRadius: 4, hoverBackgroundColor: '#2563eb' }
      ]
    };
  }
}
