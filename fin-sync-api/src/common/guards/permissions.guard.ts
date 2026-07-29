import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { PERMISSION_KEY } from '../decorators/permission.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return false;

    // Owners bypass permission checks
    if (user.role === 'Owner') return true;

    // Get companyId from params (supports both :companyId and :id variants used
    // by different controllers — e.g. the companies controller uses :id which
    // maps to companyId)
    const companyId = request.params?.companyId
      ? parseInt(request.params.companyId)
      : request.params?.id
        ? parseInt(request.params.id)
        : request.body?.companyId
          ? parseInt(request.body.companyId)
          : request.query?.companyId
            ? parseInt(request.query.companyId)
            : null;

    if (!companyId) return false;

    // Get the user's assigned role permissions via raw SQL
    const rows: { code: string }[] = await this.prisma.$queryRawUnsafe(
      `SELECT p.code FROM finsync."CompanyMember" cm
       JOIN finsync."CompanyRole" r ON cm.company_role_id = r.id
       JOIN finsync."CompanyRolePermission" crp ON crp.role_id = r.id
       JOIN finsync."Permission" p ON p.id = crp.permission_id
       WHERE cm.user_id = ${user.id} AND cm.company_id = ${companyId}`,
    );

    const userPermissionCodes = rows.map((r) => r.code);

    // Check if user has ALL required permissions
    return requiredPermissions.every((p) => userPermissionCodes.includes(p));
  }
}
