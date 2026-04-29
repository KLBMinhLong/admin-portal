import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * A2: 403 Forbidden page khi user không có permission.
 */
@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="flex flex-col items-center justify-center py-20 text-center">
      <div class="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
        <svg class="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      </div>
      <h2 class="text-xl font-bold text-slate-900 mb-2">Truy cập bị từ chối</h2>
      <p class="text-sm text-slate-500 mb-6 max-w-sm">
        Bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên nếu bạn cần quyền truy cập.
      </p>
      <a routerLink="/dashboard"
        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium
               rounded-lg transition-colors duration-200 cursor-pointer">
        Về trang chủ
      </a>
    </div>
  `,
})
export class ForbiddenComponent {}
