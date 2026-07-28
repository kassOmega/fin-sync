import { PrismaClient } from '@prisma/client';
import { SeedContext } from './utils';

const BUILTIN_ROLES: { name: string; permissions: string[] }[] = [
  {
    name: 'Operator',
    permissions: [
      'MACHINERY_READ',
      'MACHINERY_LOG_HOURS',
      'MACHINERY_MAINTENANCE',
      'REQUISITIONS_CREATE',
    ],
  },
  {
    name: 'Storekeeper',
    permissions: [
      'STORE_ITEMS_READ',
      'STORE_ITEMS_WRITE',
      'STORE_ITEMS_RESTOCK',
      'REQUISITIONS_CREATE',
      'REQUISITIONS_APPROVE',
      'MACHINERY_READ',
      'MACHINERY_MAINTENANCE',
    ],
  },
  {
    name: 'Cashier',
    permissions: [
      'FINANCES_READ',
      'FINANCES_WRITE',
      'SALES_READ',
      'SALES_WRITE',
      'STORE_ITEMS_READ',
      'REQUISITIONS_CREATE',
    ],
  },
  {
    name: 'Sales',
    permissions: [
      'SALES_READ',
      'SALES_WRITE',
      'FINANCES_READ',
      'STORE_ITEMS_READ',
      'REQUISITIONS_CREATE',
    ],
  },
  {
    name: 'ProjectManager',
    permissions: [
      'PROJECTS_READ',
      'PROJECTS_WRITE',
      'MACHINERY_READ',
      'STORE_ITEMS_READ',
      'FINANCES_READ',
      'STAFF_READ',
      'REQUISITIONS_CREATE',
    ],
  },
  {
    name: 'Foreman',
    permissions: [
      'PROJECTS_READ',
      'PROJECTS_WRITE',
      'MACHINERY_READ',
      'STORE_ITEMS_READ',
      'REQUISITIONS_CREATE',
    ],
  },
];

export async function seedRoles(
  prisma: PrismaClient,
  ctx: SeedContext,
): Promise<void> {
  console.log('🎭 Seeding Roles & Permissions...');

  // Get all permissions from DB
  const permRows: { id: number; code: string }[] = await prisma.$queryRawUnsafe(
    `SELECT id, code FROM finsync."Permission"`,
  );
  const permByCode: Record<string, number> = {};
  for (const row of permRows) {
    permByCode[row.code] = row.id;
  }

  for (const [companyKey, companyId] of Object.entries(ctx.companies)) {
    for (const roleDef of BUILTIN_ROLES) {
      const matchingPermIds = roleDef.permissions
        .filter((code) => permByCode[code])
        .map((code) => permByCode[code]);

      // Create the role
      const escapedName = roleDef.name.replace(/'/g, "''");
      await prisma.$executeRawUnsafe(
        `INSERT INTO finsync."CompanyRole" (company_id, name) VALUES (${companyId}, '${escapedName}')`,
      );

      // Get the role id
      const roleRows: { id: number }[] = await prisma.$queryRawUnsafe(
        `SELECT id FROM finsync."CompanyRole" WHERE company_id = ${companyId} AND name = '${escapedName}'`,
      );
      const roleId = roleRows[0]?.id;
      if (!roleId) continue;

      ctx.companyRoles[`${companyKey}_${roleDef.name}`] = roleId;

      // Insert permissions
      for (const permId of matchingPermIds) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO finsync."CompanyRolePermission" (role_id, permission_id) VALUES (${roleId}, ${permId}) ON CONFLICT DO NOTHING`,
        );
      }
    }

    // Assign roles to seed staff based on their system role
    const members: { id: number; role: string; user_id: number }[] =
      await prisma.$queryRawUnsafe(
        `SELECT id, role, user_id FROM finsync."CompanyMember" WHERE company_id = ${companyId}`,
      );

    for (const member of members) {
      const matchingRole = BUILTIN_ROLES.find(
        (r) => r.name.toLowerCase() === member.role.toLowerCase(),
      );
      if (matchingRole) {
        const roleId = ctx.companyRoles[`${companyKey}_${matchingRole.name}`];
        if (roleId) {
          await prisma.$executeRawUnsafe(
            `UPDATE finsync."CompanyMember" SET company_role_id = ${roleId} WHERE id = ${member.id}`,
          );
        }
      }
    }
  }

  console.log(
    `   ✅ Created ${BUILTIN_ROLES.length} role templates across ${Object.keys(ctx.companies).length} companies`,
  );
  console.log(`   ✅ Assigned roles to matching staff members`);
}
