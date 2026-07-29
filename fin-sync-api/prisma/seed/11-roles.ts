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
  console.log('🛡️ Seeding Roles & Permissions...');

  const companyKeys = Object.keys(ctx.companies);

  for (const companyKey of companyKeys) {
    const companyId = Number(ctx.companies[companyKey]);

    for (const role of BUILTIN_ROLES) {
      // Upsert CompanyRole
      const companyRole = await (prisma as any).companyRole.upsert({
        where: {
          name_companyId: {
            name: role.name,
            companyId,
          },
        },
        update: {},
        create: {
          name: role.name,
          companyId,
        },
      });

      for (const permissionKey of role.permissions) {
        // 1. Look up the Permission ID strictly using code
        const permRecord = await (prisma as any).permission.findFirst({
          where: {
            code: permissionKey,
          },
        });

        if (!permRecord) {
          console.warn(
            `⚠️ Permission '${permissionKey}' not found in database.`,
          );
          continue;
        }

        // 2. Attach permission using permissionId
        const existingPermission = await (
          prisma as any
        ).companyRolePermission.findFirst({
          where: {
            roleId: companyRole.id,
            permissionId: permRecord.id,
          },
        });

        if (!existingPermission) {
          await (prisma as any).companyRolePermission.create({
            data: {
              roleId: companyRole.id,
              permissionId: permRecord.id,
            },
          });
        }
      }
    }
  }

  console.log(
    `   ✅ Seeded ${BUILTIN_ROLES.length} built-in roles across ${companyKeys.length} companies`,
  );
}
