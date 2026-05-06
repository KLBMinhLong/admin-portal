import { Pipe, PipeTransform } from '@angular/core';
import { AdminUser } from '@core/models/user.models';

/**
 * User Display Pipe — Formats user data for display
 * Xử lý các phép format tên người dùng, initials, etc.
 * Giảm logic trong component
 */
@Pipe({
  name: 'userDisplay',
  standalone: true,
})
export class UserDisplayPipe implements PipeTransform {
  transform(
    user: AdminUser | null,
    type: 'initials' | 'fullName' | 'displayName' = 'fullName'
  ): string {
    if (!user) return '';

    switch (type) {
      case 'initials':
        return this.getInitials(user);
      case 'fullName':
        return this.getFullName(user);
      case 'displayName':
        return this.getDisplayName(user);
      default:
        return '';
    }
  }

  private getInitials(user: AdminUser): string {
    const fullName = this.getFullName(user);
    if (fullName !== 'Chưa cập nhật họ tên') {
      return fullName
        .split(' ')
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');
    }
    return user.username.charAt(0).toUpperCase();
  }

  private getFullName(user: AdminUser): string {
    const fullName = `${user.lastName ?? ''} ${user.firstName ?? ''}`.trim();
    return fullName || 'Chưa cập nhật họ tên';
  }

  private getDisplayName(user: AdminUser): string {
    const fullName = this.getFullName(user);
    return fullName;
  }
}
