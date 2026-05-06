import { Component, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { WebsocketService } from '@core/services/websocket.service';
import { Subscription } from 'rxjs';
import { IconComponent } from '@shared/components/icon/icon.component';
import { BadgeComponent } from '@shared/components/badge/badge.component';

/**
 * Navigation item configuration.
 * Tách cấu hình nav ra khỏi template → clean, dễ bảo trì.
 */
interface NavItem {
  route: string;
  icon: string;
  label: string;
  adminOnly?: boolean;
  permission?: string;
}

/**
 * Shell layout — sidebar + header + content area.
 * Theo Design System section 4.1 và 5.1/5.2.
 *
 * Refactored: Dùng app-icon thay toàn bộ inline SVG.
 * Nav items tách thành config array → template gọn hơn ~60%.
 */
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, IconComponent, BadgeComponent],
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
            <app-icon name="shield-check" size="sm" class="text-white" />
          </div>
          <span class="text-base font-semibold text-slate-900">Purchasing Portal</span>
        </div>

        <!-- Nav Items -->
        <nav class="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          @for (item of mainNavItems; track item.route) {
            <a [routerLink]="item.route" routerLinkActive="bg-blue-50 text-blue-600 font-medium"
              class="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 rounded-lg
                     hover:bg-slate-50 hover:text-slate-900 transition-colors duration-200 cursor-pointer">
              <app-icon [name]="item.icon" />
              {{ item.label }}
            </a>
          }

          @if (showAdminSection() && (canManageUsers() || canManageRoles())) {
            <div class="pt-4 pb-2">
              <span class="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Quản trị</span>
            </div>

            @for (item of adminNavItems; track item.route) {
              @if ((item.permission === 'user.manage' && canManageUsers()) || (item.permission === 'role.manage' && canManageRoles())) {
                <a [routerLink]="item.route" routerLinkActive="bg-blue-50 text-blue-600 font-medium"
                  class="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 rounded-lg
                         hover:bg-slate-50 hover:text-slate-900 transition-colors duration-200 cursor-pointer">
                  <app-icon [name]="item.icon" />
                  {{ item.label }}
                </a>
              }
            }
          }
        </nav>

        <!-- User info (sticky bottom) -->
        <div class="border-t border-slate-200 p-4 shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600">
              {{ userInitial() }}
            </div>
            <div class="flex-1 min-w-0 cursor-pointer hover:bg-slate-50 p-1 -ml-1 rounded transition-colors" routerLink="/profile" title="Hồ sơ của tôi">
              <p class="text-sm font-medium text-slate-900 truncate hover:text-blue-600">{{ authService.currentUser()?.username }}</p>
              <p class="text-xs text-slate-500 truncate">{{ authService.currentUser()?.role }}</p>
            </div>
            <button
              (click)="authService.logout()"
              title="Đăng xuất"
              class="p-1.5 text-slate-400 hover:text-red-600 transition-colors duration-200 cursor-pointer rounded-lg hover:bg-slate-100">
              <app-icon name="log-out" size="sm" />
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
            <app-icon name="menu" />
          </button>
          <div class="flex-1"></div>
          <div class="flex items-center gap-3">
            <!-- Notifications -->
            <div class="relative">
              <button (click)="toggleNotifications()" class="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors cursor-pointer relative">
                <app-icon name="bell" />
                @if (unreadCount() > 0) {
                  <span class="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                }
              </button>

              <!-- Dropdown -->
              @if (showNotifications()) {
                <div class="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50">
                  <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                    <h3 class="text-sm font-semibold text-slate-900">Thông báo</h3>
                    <button (click)="markAllAsRead()" class="text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer">Đánh dấu đã đọc</button>
                  </div>
                  <div class="max-h-80 overflow-y-auto">
                    @for (notif of notifications(); track notif.id) {
                      <div class="px-4 py-3 hover:bg-slate-50 border-b border-slate-50 transition-colors cursor-pointer"
                           [class.bg-blue-50]="!notif.read">
                        <p class="text-sm text-slate-800 font-medium">{{ notif.title }}</p>
                        <p class="text-xs text-slate-500 mt-0.5 line-clamp-2">{{ notif.message }}</p>
                        <p class="text-[10px] text-slate-400 mt-1.5">{{ notif.time }}</p>
                      </div>
                    } @empty {
                      <div class="px-4 py-8 text-center">
                        <p class="text-sm text-slate-500">Không có thông báo mới.</p>
                      </div>
                    }
                  </div>
                  <div class="p-2 border-t border-slate-100 bg-slate-50/50 text-center">
                    <a href="#" class="text-xs font-medium text-slate-600 hover:text-slate-900">Xem tất cả</a>
                  </div>
                </div>
              }
            </div>

            <!-- Vertical divider -->
            <div class="w-px h-6 bg-slate-200 mx-1 hidden sm:block"></div>

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
export class ShellComponent implements OnInit, OnDestroy {
  sidebarOpen = signal(false);
  showNotifications = signal(false);
  showAdminSection = computed(() =>
    this.authService.isAdmin() && this.authService.hasAuthority('system.config')
  );
  canManageUsers = computed(() =>
    this.showAdminSection() && this.authService.hasAuthority('user.manage')
  );
  canManageRoles = computed(() =>
    this.showAdminSection() && this.authService.hasAuthority('role.manage')
  );

  /** Main navigation items */
  readonly mainNavItems: NavItem[] = [
    { route: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { route: '/requests', icon: 'file-text', label: 'Yêu cầu mua sắm' },
    { route: '/approvals', icon: 'check-circle', label: 'Phê duyệt' },
    { route: '/reports', icon: 'bar-chart', label: 'Báo cáo' },
  ];

  /** Admin section navigation items */
  readonly adminNavItems: NavItem[] = [
    { route: '/users', icon: 'users', label: 'Người dùng', permission: 'user.manage' },
    { route: '/roles/management', icon: 'dashboard', label: 'Danh sách Role', permission: 'role.manage' },
    { route: '/roles/matrix', icon: 'shield-badge', label: 'Ma trận Phân quyền', permission: 'role.manage' },
    { route: '/roles/audit', icon: 'clipboard-list', label: 'Nhật ký kiểm toán', permission: 'role.manage' },
  ];

  // Notifications state
  notifications = signal<any[]>([]);
  unreadCount = computed(() => this.notifications().filter(n => !n.read).length);
  private wsSubscription?: Subscription;

  constructor(
    public authService: AuthService,
    private wsService: WebsocketService
  ) {}

  ngOnInit() {
    const user = this.authService.currentUser();
    if (user && user.username) {
      this.wsSubscription = this.wsService.watchUserNotifications(user.username).subscribe(message => {
        const text = message.body;
        const newNotif = {
          id: Date.now(),
          title: 'Thông báo hệ thống',
          message: text,
          time: 'Vừa xong',
          read: false
        };
        this.notifications.update(list => [newNotif, ...list]);
      });
    }
  }

  ngOnDestroy() {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
  }

  userInitial = () => {
    const name = this.authService.currentUser()?.username || '?';
    return name.charAt(0).toUpperCase();
  };

  toggleNotifications(): void {
    this.showNotifications.set(!this.showNotifications());
  }

  markAllAsRead(): void {
    this.notifications.update(list => list.map(n => ({ ...n, read: true })));
  }
}
