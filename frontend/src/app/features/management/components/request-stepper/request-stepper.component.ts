import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RequestStatus } from '@core/models/request.models';

export interface StepperStep {
  label: string;
  status: 'completed' | 'current' | 'upcoming' | 'error';
}

@Component({
  selector: 'app-request-stepper',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="py-4">
      <div class="flex items-center justify-between relative">
        <!-- Connecting line (background) -->
        <div class="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 z-0 hidden sm:block"></div>

        <!-- Progress line (foreground) -->
        <div class="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 z-0 transition-all duration-500 hidden sm:block"
             [style.width]="progressWidth()"></div>

        <!-- Steps -->
        @for (step of steps(); track step.label; let i = $index) {
          <div class="relative z-10 flex flex-col items-center gap-2 flex-1 sm:flex-none">
            <!-- Circle icon -->
            <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 bg-white transition-colors duration-300"
                 [ngClass]="{
                   'border-blue-600 text-blue-600': step.status === 'completed',
                   'border-blue-600 ring-4 ring-blue-100 text-blue-600': step.status === 'current',
                   'border-slate-300 text-slate-400': step.status === 'upcoming',
                   'border-red-500 text-red-500 ring-4 ring-red-50': step.status === 'error'
                 }">
              @if (step.status === 'completed') {
                <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              } @else if (step.status === 'error') {
                <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              } @else {
                <span class="text-xs sm:text-sm font-semibold">{{ i + 1 }}</span>
              }
            </div>

            <!-- Label -->
            <span class="text-[10px] sm:text-xs font-medium text-center whitespace-nowrap hidden sm:block"
                  [ngClass]="{
                    'text-slate-900': step.status === 'completed' || step.status === 'current',
                    'text-slate-400': step.status === 'upcoming',
                    'text-red-600': step.status === 'error'
                  }">
              {{ step.label }}
            </span>
          </div>
        }
      </div>
    </div>
  `
})
export class RequestStepperComponent {
  @Input({ required: true }) currentStatus!: RequestStatus;

  // The workflow steps mapping
  steps = computed<StepperStep[]>(() => {
    const status = this.currentStatus;
    
    // Define the generic workflow logic
    if (status === 'DRAFT') {
      return [
        { label: 'Tạo nháp', status: 'current' },
        { label: 'Đã gửi', status: 'upcoming' },
        { label: 'Chờ duyệt', status: 'upcoming' },
        { label: 'Hoàn tất', status: 'upcoming' },
      ];
    } else if (status === 'SUBMITTED') {
      return [
        { label: 'Tạo nháp', status: 'completed' },
        { label: 'Đã gửi', status: 'current' },
        { label: 'Chờ duyệt', status: 'upcoming' },
        { label: 'Hoàn tất', status: 'upcoming' },
      ];
    } else if (status === 'PENDING_APPROVAL') {
      return [
        { label: 'Tạo nháp', status: 'completed' },
        { label: 'Đã gửi', status: 'completed' },
        { label: 'Chờ duyệt', status: 'current' },
        { label: 'Hoàn tất', status: 'upcoming' },
      ];
    } else if (status === 'APPROVED') {
      return [
        { label: 'Tạo nháp', status: 'completed' },
        { label: 'Đã gửi', status: 'completed' },
        { label: 'Đã duyệt', status: 'completed' },
        { label: 'Hoàn tất', status: 'completed' },
      ];
    } else if (status === 'REJECTED') {
      return [
        { label: 'Tạo nháp', status: 'completed' },
        { label: 'Đã gửi', status: 'completed' },
        { label: 'Đang xử lý', status: 'completed' },
        { label: 'Từ chối', status: 'error' },
      ];
    } else if (status === 'CANCELLED') {
      return [
        { label: 'Tạo nháp', status: 'completed' },
        { label: 'Đã gửi', status: 'completed' },
        { label: 'Đã hủy', status: 'error' },
      ];
    }
    
    return [];
  });

  progressWidth = computed(() => {
    const s = this.steps();
    if (!s || s.length === 0) return '0%';
    const lastCompletedOrCurrentIdx = s.findIndex(x => x.status === 'current' || x.status === 'error') !== -1 
      ? s.findIndex(x => x.status === 'current' || x.status === 'error')
      : s.length - 1;
    
    const segments = s.length - 1;
    if (segments === 0) return '100%';
    return `${(lastCompletedOrCurrentIdx / segments) * 100}%`;
  });
}
