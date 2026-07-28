import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  // Owner-only: verify ownership of company
  private async verifyOwnership(companyId: number, ownerId: number) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) throw new NotFoundException('Company not found');
    if (company.ownerId !== ownerId)
      throw new ForbiddenException('You do not own this company');
  }

  // Get all system permissions
  async getPermissions() {
    return this.prisma.permission.findMany({ orderBy: { code: 'asc' } });
  }

  // Create a custom role with selected permissions
  async createRole(
    companyId: number,
    ownerId: number,
    name: string,
    permissionCodes: string[],
  ) {
    await this.verifyOwnership(companyId, ownerId);

    const permissions = await this.prisma.permission.findMany({
      where: { code: { in: permissionCodes } },
    });

    return this.prisma.companyRole.create({
      data: {
        companyId,
        name,
        permissions: {
          create: permissions.map((p) => ({ permissionId: p.id })),
        },
      },
      include: {
        permissions: { include: { permission: true } },
      },
    });
  }

  // List roles for a company
  async getRoles(companyId: number, ownerId: number) {
    await this.verifyOwnership(companyId, ownerId);
    return this.prisma.companyRole.findMany({
      where: { companyId },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get a single role
  async getRole(companyId: number, roleId: number, ownerId: number) {
    await this.verifyOwnership(companyId, ownerId);
    const role = await this.prisma.companyRole.findUnique({
      where: { id: roleId },
      include: {
        permissions: { include: { permission: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });
    if (!role || role.companyId !== companyId) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  // Update role permissions
  async updateRole(
    companyId: number,
    roleId: number,
    ownerId: number,
    name?: string,
    permissionCodes?: string[],
  ) {
    await this.verifyOwnership(companyId, ownerId);

    const role = await this.prisma.companyRole.findUnique({
      where: { id: roleId },
    });
    if (!role || role.companyId !== companyId) {
      throw new NotFoundException('Role not found');
    }

    const data: any = {};
    if (name) data.name = name;

    if (permissionCodes) {
      const permissions = await this.prisma.permission.findMany({
        where: { code: { in: permissionCodes } },
      });

      // Replace all permissions
      await this.prisma.companyRolePermission.deleteMany({
        where: { roleId },
      });
      await this.prisma.companyRolePermission.createMany({
        data: permissions.map((p) => ({
          roleId,
          permissionId: p.id,
        })),
      });
    }

    if (name) {
      await this.prisma.companyRole.update({
        where: { id: roleId },
        data: { name },
      });
    }

    return this.prisma.companyRole.findUnique({
      where: { id: roleId },
      include: {
        permissions: { include: { permission: true } },
      },
    });
  }

  // Delete role
  async deleteRole(companyId: number, roleId: number, ownerId: number) {
    await this.verifyOwnership(companyId, ownerId);
    const role = await this.prisma.companyRole.findUnique({
      where: { id: roleId },
    });
    if (!role || role.companyId !== companyId) {
      throw new NotFoundException('Role not found');
    }
    return this.prisma.companyRole.delete({ where: { id: roleId } });
  }

  // Assign role to a staff member
  async assignRoleToMember(
    companyId: number,
    memberId: number,
    roleId: number,
    ownerId: number,
  ) {
    await this.verifyOwnership(companyId, ownerId);

    const member = await this.prisma.companyMember.findUnique({
      where: { id: memberId },
    });
    if (!member || member.companyId !== companyId) {
      throw new NotFoundException('Staff member not found');
    }

    const role = await this.prisma.companyRole.findUnique({
      where: { id: roleId },
    });
    if (!role || role.companyId !== companyId) {
      throw new NotFoundException('Role not found for this company');
    }

    return this.prisma.companyMember.update({
      where: { id: memberId },
      data: { companyRoleId: roleId },
    });
  }

  // Remove role assignment from a staff member
  async removeRoleFromMember(
    companyId: number,
    memberId: number,
    ownerId: number,
  ) {
    await this.verifyOwnership(companyId, ownerId);

    const member = await this.prisma.companyMember.findUnique({
      where: { id: memberId },
    });
    if (!member || member.companyId !== companyId) {
      throw new NotFoundException('Staff member not found');
    }

    return this.prisma.companyMember.update({
      where: { id: memberId },
      data: { companyRoleId: null },
    });
  }
}
