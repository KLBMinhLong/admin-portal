import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '@shared/components/icon/icon.component';
import { ButtonComponent } from '@shared/components/button/button.component';

/**
 * A2: 403 Forbidden page khi user không có permission.
 */
@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterLink, IconComponent, ButtonComponent],
  template: `
    <div class="flex flex-col items-center justify-center py-20 text-center">
      <div class="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
        <app-icon name="no-entry" size="lg" class="text-red-500" />
      </div>
      <h2 class="text-xl font-bold text-slate-900 mb-2">Truy cập bị từ chối</h2>
      <p class="text-sm text-slate-500 mb-6 max-w-sm">
        Bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên nếu bạn cần quyền truy cập.
      </p>
      <app-button routerLink="/dashboard" icon="home">
        Về trang chủ
      </app-button>
    </div>
  `,
})
export class ForbiddenComponent {}
