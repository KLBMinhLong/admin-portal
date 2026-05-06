import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IconComponent } from '@shared/components/icon/icon.component';

/**
 * Auth layout — wrapper cho tất cả trang auth (login, register, forgot, reset, 2fa).
 * Centered card trên nền slate-50 theo Design System.
 */
@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, IconComponent],
  template: `
    <div class="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div class="w-full max-w-md">
        <!-- Logo / Brand -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl mb-4">
            <app-icon name="shield-check" size="lg" class="text-white" />
          </div>
          <h1 class="text-2xl font-bold text-slate-900">Purchasing Portal</h1>
          <p class="text-sm text-slate-500 mt-1">Hệ thống quản lý mua sắm nội bộ</p>
        </div>

        <!-- Auth Card -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <router-outlet />
        </div>
      </div>
    </div>
  `,
})
export class AuthLayoutComponent {}
