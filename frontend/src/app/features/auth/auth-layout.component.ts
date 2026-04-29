import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Auth layout — wrapper cho tất cả trang auth (login, register, forgot, reset, 2fa).
 * Centered card trên nền slate-50 theo Design System.
 */
@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div class="w-full max-w-md">
        <!-- Logo / Brand -->
        <div class="text-center mb-8">
          <div
            class="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl mb-4"
          >
            <svg
              class="w-7 h-7 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
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
