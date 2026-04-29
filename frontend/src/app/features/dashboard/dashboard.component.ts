import { Component } from '@angular/core';

/**
 * Dashboard — placeholder content (UC-FE-02 focus is management, dashboard sẽ mở rộng sau).
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <h1 class="text-2xl font-bold text-slate-900 mb-6">Dashboard</h1>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <!-- Stat cards -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Tổng yêu cầu</p>
        <p class="text-2xl font-bold text-slate-900">—</p>
      </div>
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Chờ duyệt</p>
        <p class="text-2xl font-bold text-amber-600">—</p>
      </div>
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Đã duyệt</p>
        <p class="text-2xl font-bold text-green-600">—</p>
      </div>
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Từ chối</p>
        <p class="text-2xl font-bold text-red-600">—</p>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h2 class="text-base font-semibold text-slate-900 mb-2">Chào mừng đến Purchasing Portal</h2>
      <p class="text-sm text-slate-500">
        Dashboard sẽ hiển thị biểu đồ thống kê khi có dữ liệu thực tế.
      </p>
    </div>
  `,
})
export class DashboardComponent {}
