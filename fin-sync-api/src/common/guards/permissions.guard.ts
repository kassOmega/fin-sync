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

    // If no permissions required, allow
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;

    // Owners bypass permission checks (they have all permissions)
    if (user.role === 'Owner') return true;

    // Get companyId from params if available
    const req = context.switchToHttp().getRequest();
    const companyId = req.params?.companyId
      ? parseInt(req.params.companyId)
      : null;

    if (!companyId) {
      // Try to find from body or query
      const bodyCompanyId = req.body?.companyId || req.query?.companyId;
      if (!bodyCompanyId) return false;
    }

    // Fetch user's roles and their permissions for this company
    const member = await this.prisma.companyMember.findFirst({
      where: {
        userId: user.id,
        companyId: companyId || parseInt(req.body.companyId),
      },
      include: {
        companyRole: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!member?.companyRole) return false;

    const userPermissionCodes = member.companyRole.permissions.map(
      (rp) => rp.permission.code,
    );

    // Check if user has ALL required permissions
    return requiredPermissions.every((p) => userPermissionCodes.includes(p));
  }
}
