import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permissions';
/** @deprecated Use RequirePermissions (plural) instead */
export const RequirePermission = (...permissions: string[]) =>
  SetMetadata(PERMISSION_KEY, permissions);
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSION_KEY, permissions);
