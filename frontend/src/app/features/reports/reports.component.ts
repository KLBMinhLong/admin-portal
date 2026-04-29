import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService, REPORT_TYPES, ReportType } from '@core/services/report.service';
import { STATUS_CONFIG } from '@core/models/request.models';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h1 class="text-2xl font-bold text-slate-900 mb-6">Báo cáo</h1>

    @if (errorMsg()) {
      <div class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2" role="alert">
        <svg class="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <div>
          <span>{{ errorMsg() }}</span>
          <button (click)="retry()" class="ml-2 text-red-800 font-medium underline cursor-pointer">Thử lại</button>
        </div>
      </div>
    }

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      @for (report of reportTypes; track report.id) {
        <div
          class="bg-white rounded-xl border border-slate-200 shadow-sm p-6
                 hover:shadow-md transition-shadow cursor-pointer"
          (click)="selectReport(report)">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
            [class]="report.id === 'financial-summary' ? 'bg-green-50' : report.id === 'request-detail' ? 'bg-blue-50' : 'bg-amber-50'">
            @if (report.icon === 'list') {
              <svg class="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            } @else if (report.icon === 'file') {
              <svg class="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            } @else {
              <svg class="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            }
          </div>
          <h3 class="text-base font-semibold text-slate-900 mb-1">{{ report.label }}</h3>
          <p class="text-sm text-slate-500">{{ report.description }}</p>
        </div>
      }
    </div>

    <!-- Report config dialog (inline) -->
    @if (selectedReport()) {
      <div class="mt-8 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-base font-semibold text-slate-900">{{ selectedReport()!.label }}</h2>
          <button (click)="selectedReport.set(null)" class="text-slate-400 hover:text-slate-600 cursor-pointer">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Filters based on report type -->
        <div class="space-y-4 mb-6">
          @if (selectedReport()!.id === 'requests-by-status') {
            <div>
              <label for="rpt-status" class="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
              <select id="rpt-status" [(ngModel)]="filterStatus"
                class="w-full sm:w-64 px-3 py-2 border border-slate-300 rounded-lg text-sm
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer">
                <option value="">Tất cả</option>
                @for (s of statusOptions; track s.value) {
                  <option [value]="s.value">{{ s.label }}</option>
                }
              </select>
            </div>
          }
          @if (selectedReport()!.id === 'request-detail') {
            <div>
              <label for="rpt-reqid" class="block text-sm font-medium text-slate-700 mb-1">Mã yêu cầu (ID)</label>
              <input id="rpt-reqid" type="number" [(ngModel)]="requestId"
                class="w-full sm:w-64 px-3 py-2 border border-slate-300 rounded-lg text-sm
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="VD: 1" />
            </div>
          }
          @if (selectedReport()!.id === 'financial-summary') {
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
              <div>
                <label for="rpt-from" class="block text-sm font-medium text-slate-700 mb-1">Từ ngày</label>
                <input id="rpt-from" type="date" [(ngModel)]="fromDate"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label for="rpt-to" class="block text-sm font-medium text-slate-700 mb-1">Đến ngày</label>
                <input id="rpt-to" type="date" [(ngModel)]="toDate"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
            </div>
          }
        </div>

        <button (click)="exportReport()" [disabled]="exporting()"
          class="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium
                 rounded-lg transition-colors duration-200 cursor-pointer
                 disabled:bg-slate-300 disabled:cursor-not-allowed">
          @if (exporting()) {
            <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            Đang xuất...
          } @else {
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Xuất PDF
          }
        </button>
      </div>
    }
  `,
})
export class ReportsComponent {
  reportTypes = REPORT_TYPES;
  selectedReport = signal<ReportType | null>(null);
  exporting = signal(false);
  errorMsg = signal('');

  // Filters
  filterStatus = '';
  requestId: number | null = null;
  fromDate = '';
  toDate = '';

  statusOptions = Object.entries(STATUS_CONFIG).map(([value, cfg]) => ({ value, label: cfg.label }));

  private lastExportFn: (() => void) | null = null;

  constructor(private reportService: ReportService) {}

  selectReport(report: ReportType): void {
    this.selectedReport.set(report);
    this.errorMsg.set('');
  }

  exportReport(): void {
    const report = this.selectedReport();
    if (!report) return;

    this.exporting.set(true);
    this.errorMsg.set('');

    const downloadBlob = (blob: Blob, filename: string) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      this.exporting.set(false);
    };

    const handleError = (err: HttpErrorResponse) => {
      this.exporting.set(false);
      this.errorMsg.set('Lỗi khi xuất báo cáo. Vui lòng thử lại.');
    };

    // Save for retry
    this.lastExportFn = () => this.exportReport();

    switch (report.id) {
      case 'requests-by-status':
        this.reportService.exportRequestsByStatus(this.filterStatus || undefined).subscribe({
          next: (blob) => downloadBlob(blob, `requests-by-status_${new Date().toISOString().slice(0, 10)}.pdf`),
          error: handleError,
        });
        break;
      case 'request-detail':
        if (!this.requestId) {
          this.exporting.set(false);
          this.errorMsg.set('Vui lòng nhập mã yêu cầu.');
          return;
        }
        this.reportService.exportRequestDetail(this.requestId).subscribe({
          next: (blob) => downloadBlob(blob, `request-detail_${this.requestId}.pdf`),
          error: handleError,
        });
        break;
      case 'financial-summary':
        this.reportService.exportFinancialSummary(this.fromDate || undefined, this.toDate || undefined).subscribe({
          next: (blob) => downloadBlob(blob, `financial-summary_${this.fromDate || 'all'}_${this.toDate || 'now'}.pdf`),
          error: handleError,
        });
        break;
    }
  }

  /** A3: Retry on error */
  retry(): void {
    if (this.lastExportFn) this.lastExportFn();
  }
}
