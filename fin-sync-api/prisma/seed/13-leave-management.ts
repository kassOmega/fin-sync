import { PrismaClient } from '@prisma/client';
import { SeedContext } from './utils';

interface SeedLeaveType {
  name: string;
  isPaid: boolean;
  defaultDaysPerYear: number;
  maxCarryForwardDays: number | null;
  requiresApproval: boolean;
}

interface SeedLeaveBalance {
  employeeKey: string;
  leaveTypeName: string;
  totalDays?: number;
  usedDays?: number;
}

interface SeedLeaveRequest {
  employeeKey: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  isHalfDay?: boolean;
  reason?: string;
  status: string;
}

const DEFAULT_LEAVE_TYPES: SeedLeaveType[] = [
  {
    name: 'Annual Leave',
    isPaid: true,
    defaultDaysPerYear: 20,
    maxCarryForwardDays: 5,
    requiresApproval: true,
  },
  {
    name: 'Sick Leave',
    isPaid: true,
    defaultDaysPerYear: 12,
    maxCarryForwardDays: 0,
    requiresApproval: false,
  },
  {
    name: 'Maternity Leave',
    isPaid: true,
    defaultDaysPerYear: 90,
    maxCarryForwardDays: 0,
    requiresApproval: true,
  },
  {
    name: 'Unpaid Leave',
    isPaid: false,
    defaultDaysPerYear: 30,
    maxCarryForwardDays: 0,
    requiresApproval: true,
  },
];

const SAMPLE_REQUESTS: SeedLeaveRequest[] = [
  {
    employeeKey: 'buildco_carlos',
    leaveTypeName: 'Annual Leave',
    startDate: daysFromNowStr(5),
    endDate: daysFromNowStr(9),
    totalDays: 5,
    reason: 'Family vacation',
    status: 'APPROVED',
  },
  {
    employeeKey: 'buildco_raj',
    leaveTypeName: 'Sick Leave',
    startDate: daysFromNowStr(2),
    endDate: daysFromNowStr(2),
    totalDays: 1,
    reason: 'Doctor appointment',
    status: 'APPROVED',
  },
  {
    employeeKey: 'horizon_linda',
    leaveTypeName: 'Annual Leave',
    startDate: daysFromNowStr(10),
    endDate: daysFromNowStr(14),
    totalDays: 5,
    reason: 'Personal trip',
    status: 'PENDING',
  },
  {
    employeeKey: 'techmfg_priya',
    leaveTypeName: 'Annual Leave',
    startDate: daysFromNowStr(20),
    endDate: daysFromNowStr(24),
    totalDays: 5,
    reason: 'Wedding anniversary',
    status: 'PENDING',
  },
  {
    employeeKey: 'buildco_liam',
    leaveTypeName: 'Sick Leave',
    startDate: daysAgo(10),
    endDate: daysAgo(7),
    totalDays: 3,
    reason: 'Flu recovery',
    status: 'APPROVED',
  },
  {
    employeeKey: 'urban_sophie',
    leaveTypeName: 'Maternity Leave',
    startDate: daysAgo(30),
    endDate: daysFromNowStr(60),
    totalDays: 90,
    reason: 'Maternity leave',
    status: 'APPROVED',
  },
];

function daysFromNowStr(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

export async function seedLeaveManagement(
  prisma: PrismaClient,
  ctx: SeedContext,
): Promise<void> {
  console.log('🏖️  Seeding Leave Management...');

  const companyKeys = Object.keys(ctx.companies);
  let leaveTypeCount = 0;
  let balanceCount = 0;
  let requestCount = 0;

  for (const companyKey of companyKeys) {
    const companyId = Number(ctx.companies[companyKey]);

    // Create leave types
    const leaveTypeMap = new Map<string, number>();
    for (const lt of DEFAULT_LEAVE_TYPES) {
      const existing = await (prisma as any).leaveType.findFirst({
        where: { companyId, name: lt.name },
      });
      if (!existing) {
        const created = await (prisma as any).leaveType.create({
          data: {
            companyId,
            name: lt.name,
            isPaid: lt.isPaid,
            defaultDaysPerYear: lt.defaultDaysPerYear,
            maxCarryForwardDays: lt.maxCarryForwardDays,
            requiresApproval: lt.requiresApproval,
          },
        });
        leaveTypeMap.set(lt.name, created.id);
        leaveTypeCount++;
      }
    }

    // Create balances for all employees of this company
    const employeeKeys = Object.keys(ctx.employees).filter((key) => {
      // Find employees belonging to this company by checking seed data pattern
      const empCompanies: Record<string, string[]> = {
        buildco: ['buildco_'],
        horizon: ['horizon_'],
        greenvalley: ['green_'],
        urban_threads: ['urban_'],
        tech_mfg: ['techmfg_', 'tech_'],
      };
      const prefixes = empCompanies[companyKey];
      return prefixes?.some((prefix) => key.startsWith(prefix));
    });

    const year = new Date().getFullYear();
    for (const empKey of employeeKeys) {
      const employeeId = Number(ctx.employees[empKey]);
      for (const [typeName, typeId] of leaveTypeMap) {
        const existingBalance = await (prisma as any).leaveBalance.findFirst({
          where: { employeeId, leaveTypeId: typeId, year },
        });
        if (!existingBalance) {
          await (prisma as any).leaveBalance.create({
            data: {
              employeeId,
              leaveTypeId: typeId,
              year,
              totalDays:
                DEFAULT_LEAVE_TYPES.find((lt) => lt.name === typeName)
                  ?.defaultDaysPerYear || 20,
            },
          });
          balanceCount++;
        }
      }
    }
  }

  // Create sample leave requests
  for (const req of SAMPLE_REQUESTS) {
    const employeeId = ctx.employees[req.employeeKey];
    if (!employeeId) continue;

    // Find the employee's company
    const empRow: any = await (prisma as any).employee.findUnique({
      where: { id: employeeId },
      select: { companyId: true },
    });
    if (!empRow) continue;

    // Find the leave type
    const ltRow: any = await (prisma as any).leaveType.findFirst({
      where: { companyId: empRow.companyId, name: req.leaveTypeName },
    });
    if (!ltRow) continue;

    const existing = await (prisma as any).leaveRequest.findFirst({
      where: {
        employeeId,
        leaveTypeId: ltRow.id,
        startDate: new Date(req.startDate),
        endDate: new Date(req.endDate),
      },
    });
    if (!existing) {
      await (prisma as any).leaveRequest.create({
        data: {
          employeeId,
          leaveTypeId: ltRow.id,
          companyId: empRow.companyId,
          startDate: new Date(req.startDate),
          endDate: new Date(req.endDate),
          totalDays: req.totalDays,
          isHalfDay: req.isHalfDay ?? false,
          reason: req.reason,
          status: req.status,
        },
      });

      // Update balance for approved requests
      if (req.status === 'APPROVED') {
        const balance = await (prisma as any).leaveBalance.findFirst({
          where: {
            employeeId,
            leaveTypeId: ltRow.id,
            year: new Date().getFullYear(),
          },
        });
        if (balance) {
          await (prisma as any).leaveBalance.update({
            where: { id: balance.id },
            data: { usedDays: req.totalDays },
          });
        }
      }

      requestCount++;
    }
  }

  console.log(
    `   ✅ Seeded ${leaveTypeCount} leave types, ${balanceCount} balances, ${requestCount} requests`,
  );
}
