import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService, REPORT_TYPES, ReportType } from '@core/services/report.service';
import { STATUS_CONFIG } from '@core/models/request.models';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from '@shared/components/toast/toast.service';
import { 
  PageHeaderComponent, CardComponent, ButtonComponent, 
  SelectComponent, InputComponent, SelectOption, IconComponent
} from '@shared/components';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    PageHeaderComponent, CardComponent, ButtonComponent, 
    SelectComponent, InputComponent, IconComponent
  ],
  template: `
    <div class="flex flex-col gap-6">
      <app-page-header title="Báo cáo" description="Xuất các báo cáo liên quan đến yêu cầu mua sắm và tài chính" />

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        @for (report of reportTypes; track report.id) {
          <div
            class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group"
            (click)="selectReport(report)">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
              [class]="report.id === 'financial-summary' ? 'bg-green-100 text-green-600' : report.id === 'request-detail' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'">
              @if (report.icon === 'list') {
                <app-icon name="document-text" class="w-6 h-6" />
              } @else if (report.icon === 'file') {
                <app-icon name="document-duplicate" class="w-6 h-6" />
              } @else {
                <app-icon name="chart-pie" class="w-6 h-6" />
              }
            </div>
            <h3 class="text-lg font-semibold text-slate-900 mb-2">{{ report.label }}</h3>
            <p class="text-sm text-slate-500 line-clamp-2">{{ report.description }}</p>
          </div>
        }
      </div>

      <!-- Report config dialog (inline) -->
      @if (selectedReport()) {
        <div class="mt-4">
          <app-card>
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-lg font-bold text-slate-900">{{ selectedReport()!.label }}</h2>
              <button (click)="selectedReport.set(null)" class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                <app-icon name="x-circle" />
              </button>
            </div>

            <!-- Filters based on report type -->
            <div class="space-y-6 mb-8">
              @if (selectedReport()!.id === 'requests-by-status') {
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Trạng thái yêu cầu</label>
                  <div class="w-full sm:w-80">
                    <app-select [(ngModel)]="filterStatus" [options]="statusOptions" placeholder="Tất cả trạng thái" />
                  </div>
                </div>
              }
              @if (selectedReport()!.id === 'request-detail') {
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Mã yêu cầu (ID)</label>
                  <div class="w-full sm:w-80">
                    <app-input type="number" [(ngModel)]="requestId" placeholder="VD: 1" />
                  </div>
                </div>
              }
              @if (selectedReport()!.id === 'financial-summary') {
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">Từ ngày</label>
                    <app-input type="date" [(ngModel)]="fromDate" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">Đến ngày</label>
                    <app-input type="date" [(ngModel)]="toDate" />
                  </div>
                </div>
              }
            </div>

            <div class="flex border-t border-slate-100 pt-6">
              <app-button 
                variant="primary" 
                icon="document-arrow-down" 
                [loading]="exporting()" 
                (onClick)="exportReport()"
              >
                Xuất file PDF
              </app-button>
            </div>
          </app-card>
        </div>
      }
    </div>
  `,
})
export class ReportsComponent {
  reportTypes = REPORT_TYPES;
  selectedReport = signal<ReportType | null>(null);
  exporting = signal(false);

  // Filters
  filterStatus = '';
  requestId: number | null = null;
  fromDate = '';
  toDate = '';

  statusOptions: SelectOption[] = [
    { value: '', label: 'Tất cả' },
    ...Object.entries(STATUS_CONFIG).map(([value, cfg]) => ({ value, label: cfg.label }))
  ];

  private reportService = inject(ReportService);
  private toastService = inject(ToastService);

  selectReport(report: ReportType): void {
    this.selectedReport.set(report);
  }

  exportReport(): void {
    const report = this.selectedReport();
    if (!report) return;

    this.exporting.set(true);

    const downloadBlob = (blob: Blob, filename: string) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      this.exporting.set(false);
      this.toastService.success('Thành công', 'Báo cáo đã được xuất thành công.');
    };

    const handleError = (err: HttpErrorResponse) => {
      this.exporting.set(false);
      this.toastService.error('Lỗi', 'Lỗi khi xuất báo cáo. Vui lòng thử lại.');
    };

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
          this.toastService.error('Lỗi', 'Vui lòng nhập mã yêu cầu.');
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
}
