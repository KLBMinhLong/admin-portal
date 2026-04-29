import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';

/**
 * Shell layout — sidebar + header + content area.
 * Theo Design System section 4.1 và 5.1/5.2.
 */
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <!-- Mobile overlay -->
    @if (sidebarOpen()) {
      <div
        class="fixed inset-0 bg-black/30 z-40 md:hidden"
        (click)="sidebarOpen.set(false)"
      ></div>
    }

    <div class="min-h-screen bg-slate-50 flex">
      <!-- Sidebar -->
      <aside
        class="fixed top-0 left-0 h-full bg-white border-r border-slate-200 z-50
               w-64 transition-transform duration-300 ease-out
               flex flex-col"
        [class.-translate-x-full]="!sidebarOpen()"
        [class.translate-x-0]="sidebarOpen()"
        [class.md:translate-x-0]="true"
      >
        <!-- Logo -->
        <div class="h-16 flex items-center gap-3 px-5 border-b border-slate-200 shrink-0">
          <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <span class="text-base font-semibold text-slate-900">Purchasing Portal</span>
        </div>

        <!-- Nav Items -->
        <nav class="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <a routerLink="/dashboard" routerLinkActive="bg-blue-50 text-blue-600 font-medium"
            class="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 rounded-lg
                   hover:bg-slate-50 hover:text-slate-900 transition-colors duration-200 cursor-pointer">
            <!-- LayoutDashboard icon -->
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
            Dashboard
          </a>

          <a routerLink="/requests" routerLinkActive="bg-blue-50 text-blue-600 font-medium"
            class="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 rounded-lg
                   hover:bg-slate-50 hover:text-slate-900 transition-colors duration-200 cursor-pointer">
            <!-- FileText icon -->
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            Yêu cầu mua sắm
          </a>

          <a routerLink="/approvals" routerLinkActive="bg-blue-50 text-blue-600 font-medium"
            class="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 rounded-lg
                   hover:bg-slate-50 hover:text-slate-900 transition-colors duration-200 cursor-pointer">
            <!-- CheckCircle icon -->
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Phê duyệt
          </a>

          <!-- Section divider -->
          <div class="pt-4 pb-2">
            <span class="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Quản trị</span>
          </div>

          <a routerLink="/users" routerLinkActive="bg-blue-50 text-blue-600 font-medium"
            class="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 rounded-lg
                   hover:bg-slate-50 hover:text-slate-900 transition-colors duration-200 cursor-pointer">
            <!-- Users icon -->
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            Người dùng
          </a>
        </nav>

        <!-- User info (sticky bottom) -->
        <div class="border-t border-slate-200 p-4 shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600">
              {{ userInitial() }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-slate-900 truncate">{{ authService.currentUser()?.username }}</p>
              <p class="text-xs text-slate-500 truncate">{{ authService.currentUser()?.role }}</p>
            </div>
            <button
              (click)="authService.logout()"
              title="Đăng xuất"
              class="p-1.5 text-slate-400 hover:text-red-600 transition-colors duration-200 cursor-pointer rounded-lg hover:bg-slate-100">
              <!-- LogOut icon -->
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <!-- Main content area -->
      <div class="flex-1 md:ml-64 flex flex-col min-h-screen">
        <!-- Header -->
        <header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
          <button
            (click)="sidebarOpen.set(!sidebarOpen())"
            class="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <div class="flex-1"></div>
          <div class="flex items-center gap-3">
            <span class="text-sm text-slate-500 hidden sm:inline">
              Xin chào, <strong class="text-slate-900">{{ authService.currentUser()?.username }}</strong>
            </span>
          </div>
        </header>

        <!-- Page content -->
        <main class="flex-1 p-6">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class ShellComponent {
  sidebarOpen = signal(false);

  constructor(public authService: AuthService) {}

  userInitial = () => {
    const name = this.authService.currentUser()?.username || '?';
    return name.charAt(0).toUpperCase();
  };
}
