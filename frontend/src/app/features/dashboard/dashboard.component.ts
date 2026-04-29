import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@core/auth/auth.service';

/**
 * Dashboard placeholder — sẽ được implement đầy đủ trong UC-FE-02.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-slate-50">
      <!-- Header -->
      <header class="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6">
        <h1 class="text-xl font-semibold text-slate-900">Dashboard</h1>
        <div class="flex items-center gap-4">
          <span class="text-sm text-slate-600">
            Xin chào, <strong class="text-slate-900">{{ authService.currentUser()?.username }}</strong>
          </span>
          <button
            (click)="authService.logout()"
            class="px-3 py-1.5 text-sm font-medium text-slate-600 border border-slate-300
                   rounded-lg hover:bg-slate-50 transition-colors duration-200 cursor-pointer"
          >
            Đăng xuất
          </button>
        </div>
      </header>

      <!-- Content -->
      <main class="p-6">
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 class="text-base font-semibold text-slate-900 mb-2">Chào mừng đến Purchasing Portal</h2>
          <p class="text-sm text-slate-500">
            Module dashboard sẽ được hoàn thiện trong UC-FE-02.
          </p>
        </div>
      </main>
    </div>
  `,
})
export class DashboardComponent {
  constructor(public authService: AuthService) {}
}
