import { PrismaClient } from '@prisma/client';
import { SeedContext } from './utils';

const BUILTIN_ROLES: { name: string; permissions: string[] }[] = [
  {
    name: 'Operator',
    permissions: [
      'MACHINERY_READ',
      'MACHINERY_OPERATE',
      'MACHINERY_MAINTAIN',
      'STORE_REQUEST_CREATE',
    ],
  },
  {
    name: 'Storekeeper',
    permissions: [
      'STORE_READ',
      'STORE_WRITE',
      'STORE_TRANSACTION',
      'STORE_REQUEST_CREATE',
      'STORE_REQUEST_APPROVE',
      'STORE_REQUEST_ISSUE',
      'MACHINERY_READ',
      'MACHINERY_MAINTAIN',
      'PURCHASES_READ',
      'PURCHASES_WRITE',
    ],
  },
  {
    name: 'Cashier',
    permissions: [
      'FINANCE_INCOME_READ',
      'FINANCE_INCOME_WRITE',
      'FINANCE_EXPENSE_READ',
      'FINANCE_EXPENSE_WRITE',
      'SALES_READ',
      'SALES_WRITE',
      'STORE_READ',
      'STORE_REQUEST_CREATE',
    ],
  },
  {
    name: 'Sales',
    permissions: [
      'SALES_READ',
      'SALES_WRITE',
      'CUSTOMER_MANAGE',
      'FINANCE_INCOME_READ',
      'STORE_READ',
      'STORE_REQUEST_CREATE',
    ],
  },
  {
    name: 'ProjectManager',
    permissions: [
      'PROJECTS_READ',
      'PROJECTS_WRITE',
      'PROJECTS_DELETE',
      'MACHINERY_READ',
      'STORE_READ',
      'FINANCE_INCOME_READ',
      'FINANCE_EXPENSE_READ',
      'COMPANY_STAFF_MANAGE',
      'EMPLOYEES_MANAGE',
      'STORE_REQUEST_CREATE',
      'REPORTS_VIEW',
    ],
  },
  {
    name: 'Foreman',
    permissions: [
      'PROJECTS_READ',
      'PROJECTS_WRITE',
      'MACHINERY_READ',
      'MACHINERY_OPERATE',
      'STORE_READ',
      'STORE_REQUEST_CREATE',
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

      const escapedName = roleDef.name.replace(/'/g, "''");
      await prisma.$executeRawUnsafe(
        `INSERT INTO finsync."CompanyRole" (company_id, name) VALUES (${companyId}, '${escapedName}')`,
      );

      const roleRows: { id: number }[] = await prisma.$queryRawUnsafe(
        `SELECT id FROM finsync."CompanyRole" WHERE company_id = ${companyId} AND name = '${escapedName}'`,
      );
      const roleId = roleRows[0]?.id;
      if (!roleId) continue;

      ctx.companyRoles[`${companyKey}_${roleDef.name}`] = roleId;

      for (const permId of matchingPermIds) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO finsync."CompanyRolePermission" (role_id, permission_id) VALUES (${roleId}, ${permId}) ON CONFLICT DO NOTHING`,
        );
      }
    }

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
