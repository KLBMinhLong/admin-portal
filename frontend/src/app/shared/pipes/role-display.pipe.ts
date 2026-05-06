import { Pipe, PipeTransform } from '@angular/core';
import { AdminUserRoleOption, formatRoleCode } from '@core/models/user.models';

/**
 * Role Display Pipe — Formats role codes to display names
 * Takes roleCode + roleOptions array to resolve name
 */
@Pipe({
  name: 'roleDisplay',
  standalone: true,
})
export class RoleDisplayPipe implements PipeTransform {
  transform(roleCode: string | null, roleOptions: AdminUserRoleOption[] = []): string {
    if (!roleCode) return '';

    const role = roleOptions.find((r) => r.code === roleCode);
    return role?.name ?? formatRoleCode(roleCode);
  }
}
