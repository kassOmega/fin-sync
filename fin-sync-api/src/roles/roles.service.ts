import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  private async verifyOwnership(companyId: number, ownerId: number) {
    const rows: { owner_id: number }[] = await this.prisma.$queryRawUnsafe(
      `SELECT owner_id FROM finsync."Company" WHERE id = ${companyId}`,
    );
    const company = rows[0];
    if (!company) throw new NotFoundException('Company not found');
    if (company.owner_id !== ownerId)
      throw new ForbiddenException('You do not own this company');
  }

  // Get all system permissions
  async getPermissions() {
    return this.prisma.$queryRawUnsafe(
      `SELECT id, code, description FROM finsync."Permission" ORDER BY code ASC`,
    );
  }

  // Create a custom role with selected permissions
  async createRole(
    companyId: number,
    ownerId: number,
    name: string,
    permissionCodes: string[],
  ) {
    await this.verifyOwnership(companyId, ownerId);

    // Get permission IDs
    const perms: { id: number }[] = await this.prisma.$queryRawUnsafe(
      permissionCodes.length > 0
        ? `SELECT id FROM finsync."Permission" WHERE code IN (${permissionCodes.map((c) => `'${c.replace(/'/g, "''")}'`).join(',')})`
        : `SELECT id FROM finsync."Permission" WHERE FALSE`,
    );

    // Create role
    const escapedName = name.replace(/'/g, "''");
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO finsync."CompanyRole" (company_id, name) VALUES (${companyId}, '${escapedName}')`,
    );

    // Get role ID
    const roleRows: { id: number }[] = await this.prisma.$queryRawUnsafe(
      `SELECT id FROM finsync."CompanyRole" WHERE company_id = ${companyId} AND name = '${escapedName}'`,
    );
    const roleId = roleRows[0]?.id;

    // Insert permissions
    if (roleId) {
      for (const perm of perms) {
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO finsync."CompanyRolePermission" (role_id, permission_id) VALUES (${roleId}, ${perm.id}) ON CONFLICT DO NOTHING`,
        );
      }
    }

    return this.getRole(companyId, roleId!, ownerId);
  }

  // List roles for a company
  async getRoles(companyId: number, ownerId: number) {
    await this.verifyOwnership(companyId, ownerId);

    const roles: { id: number; name: string; created_at: string }[] =
      await this.prisma.$queryRawUnsafe(
        `SELECT id, name, created_at FROM finsync."CompanyRole" WHERE company_id = ${companyId} ORDER BY created_at DESC`,
      );

    const result: {
      id: number;
      name: string;
      createdAt: string;
      permissions: {
        permission: { id: number; code: string; description: string };
      }[];
      _count: { members: number };
    }[] = [];
    for (const role of roles) {
      const permissions: {
        permission_id: number;
        code: string;
        description: string;
      }[] = await this.prisma.$queryRawUnsafe(
        `SELECT crp.permission_id, p.code, p.description FROM finsync."CompanyRolePermission" crp JOIN finsync."Permission" p ON crp.permission_id = p.id WHERE crp.role_id = ${role.id}`,
      );

      const countRows: { count: string }[] = await this.prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as count FROM finsync."CompanyMember" WHERE company_role_id = ${role.id}`,
      );

      result.push({
        id: role.id,
        name: role.name,
        createdAt: role.created_at,
        permissions: permissions.map((p) => ({
          permission: {
            id: p.permission_id,
            code: p.code,
            description: p.description,
          },
        })),
        _count: { members: parseInt(countRows[0]?.count || '0') },
      });
    }

    return result;
  }

  // Get a single role
  async getRole(companyId: number, roleId: number, ownerId: number) {
    await this.verifyOwnership(companyId, ownerId);

    const roleRows: { id: number; name: string; created_at: string }[] =
      await this.prisma.$queryRawUnsafe(
        `SELECT id, name, created_at FROM finsync."CompanyRole" WHERE id = ${roleId} AND company_id = ${companyId}`,
      );
    if (!roleRows[0]) throw new NotFoundException('Role not found');

    const role = roleRows[0];

    const permissions: {
      permission_id: number;
      code: string;
      description: string;
    }[] = await this.prisma.$queryRawUnsafe(
      `SELECT crp.permission_id, p.code, p.description FROM finsync."CompanyRolePermission" crp JOIN finsync."Permission" p ON crp.permission_id = p.id WHERE crp.role_id = ${roleId}`,
    );

    const members: { id: number; name: string; email: string }[] =
      await this.prisma.$queryRawUnsafe(
        `SELECT u.id, u.name, u.email FROM finsync."CompanyMember" cm JOIN finsync."User" u ON cm.user_id = u.id WHERE cm.company_role_id = ${roleId}`,
      );

    return {
      id: role.id,
      name: role.name,
      createdAt: role.created_at,
      permissions: permissions.map((p) => ({
        permission: {
          id: p.permission_id,
          code: p.code,
          description: p.description,
        },
      })),
      members,
    };
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

    const roleRows: { id: number }[] = await this.prisma.$queryRawUnsafe(
      `SELECT id FROM finsync."CompanyRole" WHERE id = ${roleId} AND company_id = ${companyId}`,
    );
    if (!roleRows[0]) throw new NotFoundException('Role not found');

    if (name) {
      const escapedName = name.replace(/'/g, "''");
      await this.prisma.$executeRawUnsafe(
        `UPDATE finsync."CompanyRole" SET name = '${escapedName}' WHERE id = ${roleId}`,
      );
    }

    if (permissionCodes) {
      // Remove all existing permissions
      await this.prisma.$executeRawUnsafe(
        `DELETE FROM finsync."CompanyRolePermission" WHERE role_id = ${roleId}`,
      );

      // Insert new ones
      if (permissionCodes.length > 0) {
        const perms: { id: number }[] = await this.prisma.$queryRawUnsafe(
          `SELECT id FROM finsync."Permission" WHERE code IN (${permissionCodes.map((c) => `'${c.replace(/'/g, "''")}'`).join(',')})`,
        );
        for (const perm of perms) {
          await this.prisma.$executeRawUnsafe(
            `INSERT INTO finsync."CompanyRolePermission" (role_id, permission_id) VALUES (${roleId}, ${perm.id}) ON CONFLICT DO NOTHING`,
          );
        }
      }
    }

    return this.getRole(companyId, roleId, ownerId);
  }

  // Delete role
  async deleteRole(companyId: number, roleId: number, ownerId: number) {
    await this.verifyOwnership(companyId, ownerId);

    const roleRows: { id: number }[] = await this.prisma.$queryRawUnsafe(
      `SELECT id FROM finsync."CompanyRole" WHERE id = ${roleId} AND company_id = ${companyId}`,
    );
    if (!roleRows[0]) throw new NotFoundException('Role not found');

    await this.prisma.$executeRawUnsafe(
      `DELETE FROM finsync."CompanyRole" WHERE id = ${roleId}`,
    );
    return { success: true };
  }

  // Assign role to a staff member
  async assignRoleToMember(
    companyId: number,
    memberId: number,
    roleId: number,
    ownerId: number,
  ) {
    await this.verifyOwnership(companyId, ownerId);

    const members: { id: number }[] = await this.prisma.$queryRawUnsafe(
      `SELECT id FROM finsync."CompanyMember" WHERE id = ${memberId} AND company_id = ${companyId}`,
    );
    if (!members[0]) throw new NotFoundException('Staff member not found');

    const roles: { id: number }[] = await this.prisma.$queryRawUnsafe(
      `SELECT id FROM finsync."CompanyRole" WHERE id = ${roleId} AND company_id = ${companyId}`,
    );
    if (!roles[0])
      throw new NotFoundException('Role not found for this company');

    await this.prisma.$executeRawUnsafe(
      `UPDATE finsync."CompanyMember" SET company_role_id = ${roleId} WHERE id = ${memberId}`,
    );
    return { success: true };
  }

  // Remove role assignment from a staff member
  async removeRoleFromMember(
    companyId: number,
    memberId: number,
    ownerId: number,
  ) {
    await this.verifyOwnership(companyId, ownerId);

    const members: { id: number }[] = await this.prisma.$queryRawUnsafe(
      `SELECT id FROM finsync."CompanyMember" WHERE id = ${memberId} AND company_id = ${companyId}`,
    );
    if (!members[0]) throw new NotFoundException('Staff member not found');

    await this.prisma.$executeRawUnsafe(
      `UPDATE finsync."CompanyMember" SET company_role_id = NULL WHERE id = ${memberId}`,
    );
    return { success: true };
  }
}
