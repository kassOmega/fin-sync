import { Injectable, NotFoundException } from '@nestjs/common';
import { SystemRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    companyId: number,
    filters?: {
      employmentType?: string;
      isActive?: string;
      search?: string;
      role?: string;
    },
  ) {
    let where = `e."companyId" = ${companyId}`;
    if (filters?.employmentType) {
      where += ` AND e."employmentType" = '${filters.employmentType}'`;
    }
    if (filters?.isActive !== undefined && filters.isActive !== '') {
      where += ` AND e."isActive" = ${filters.isActive === 'true'}`;
    }
    if (filters?.search) {
      const s = filters.search.replace(/'/g, "''");
      where += ` AND (e."firstName" ILIKE '%${s}%' OR e."lastName" ILIKE '%${s}%' OR e."employeeCode" ILIKE '%${s}%')`;
    }
    if (filters?.role) {
      where += ` AND u.role = '${filters.role}'`;
    }

    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT e.*, json_build_object('id', u.id, 'name', u.name, 'email', u.email, 'role', u.role) AS user
       FROM finsync.employees e
       LEFT JOIN finsync."User" u ON u.id = e."userId"
       WHERE ${where}
       ORDER BY e."firstName", e."lastName"`,
    );
    return rows;
  }

  async findOne(id: number) {
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT e.*, json_build_object('id', u.id, 'name', u.name, 'email', u.email, 'role', u.role) AS user
       FROM finsync.employees e
       LEFT JOIN finsync."User" u ON u.id = e."userId"
       WHERE e.id = ${id}`,
    );
    if (!rows.length) throw new NotFoundException('Employee not found');
    return rows[0];
  }

  /**
   * Create an employee. If a `role` (SystemRole) is provided:
   *   - auto-create a staff User account (with a generated or provided password)
   *   - create CompanyMember link with that role
   *   - link Employee.userId to the new User
   * If NO role is provided: employee-only record (no staff login).
   */
  async create(
    companyId: number,
    dto: CreateEmployeeDto & { role?: SystemRole; password?: string },
  ) {
    return this.prisma.$transaction(async (prisma) => {
      let userId: number | null = dto.userId ?? null;

      // Role provided → auto-create staff account
      if (dto.role) {
        // If a userId is explicitly provided, reuse it; otherwise create a User
        if (!userId) {
          // Email fallback if absent (User.email is unique & required)
          const email = dto.email?.trim()
            ? dto.email
            : `${dto.firstName.toLowerCase()}.${dto.lastName.toLowerCase()}@${companyId}.emp.local`;

          const hashedPassword = await bcrypt.hash(
            dto.password || 'ChangeMe123!',
            10,
          );

          const newUser = await prisma.user.create({
            data: {
              name: `${dto.firstName} ${dto.lastName}`.trim(),
              email,
              password: hashedPassword,
              phone: dto.phone,
              role: dto.role,
            },
          });
          userId = newUser.id;

          // CompanyMember link (if one doesn't already exist)
          const existingMember = await prisma.companyMember.findFirst({
            where: { userId: newUser.id, companyId },
          });
          if (!existingMember) {
            await prisma.companyMember.create({
              data: { userId: newUser.id, companyId, role: dto.role },
            });
          }
        } else {
          // userId provided → ensure CompanyMember link + update role if needed
          const existingMember = await prisma.companyMember.findFirst({
            where: { userId, companyId },
          });
          if (!existingMember) {
            await prisma.companyMember.create({
              data: { userId, companyId, role: dto.role },
            });
          } else if (existingMember.role !== dto.role) {
            await prisma.companyMember.update({
              where: { id: existingMember.id },
              data: { role: dto.role },
            });
          }
          // Also sync the User role if changed
          const linkedUser = await prisma.user.findUnique({
            where: { id: userId },
          });
          if (linkedUser && linkedUser.role !== dto.role) {
            await prisma.user.update({
              where: { id: userId },
              data: { role: dto.role },
            });
          }
        }
      }

      // Gross ⇄ Net resolution (dynamic tax + pension from active config)
      const salary = await this.resolveSalary(companyId, dto);

      // Create the employee
      const created = await prisma.employee.create({
        data: {
          companyId,
          employeeCode: dto.employeeCode,
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          phone: dto.phone,
          designation: dto.designation || dto.role || 'Employee',
          employmentType: dto.employmentType || 'FULL_TIME',
          payFrequency: dto.payFrequency || 'MONTHLY',
          baseSalary: salary.baseSalary,
          hourlyRate: salary.hourlyRate,
          dailyRate: salary.dailyRate,
          isActive: dto.isActive ?? true,
          joinedDate: dto.joinedDate ? new Date(dto.joinedDate) : new Date(),
          userId,
        },
      });

      return this.findOneAfterCreate(created.id);
    });
  }

  /**
   * Net ↔ Gross (MONTHLY) using the company's ACTIVE versioned payroll config
   * (Ethiopian shortcut tax + employee pension). Mirrors DeductionsService.
   */
  private async getActiveConfigRow(companyId: number) {
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM finsync.company_payroll_config_versions
       WHERE company_id = ${companyId}
         AND effective_from <= NOW()
         AND (superseded_at IS NULL OR superseded_at > NOW())
       ORDER BY effective_from DESC
       LIMIT 1`,
    );
    return rows[0] ?? null;
  }

  private ethiopianTax(
    income: number,
    brackets: Array<{ upTo: number | null; rate: number; deduct: number }>,
  ): number {
    let tax = 0;
    for (const b of brackets) {
      const upTo = b.upTo ?? Infinity;
      if (income <= upTo) {
        tax = income * b.rate - b.deduct;
        break;
      }
    }
    if (tax < 0) tax = 0;
    return Math.round(tax * 100) / 100;
  }

  private async grossToNetMonthly(companyId: number, gross: number) {
    const config = await this.getActiveConfigRow(companyId);
    const brackets =
      config?.tax_brackets && config.tax_brackets.length
        ? typeof config.tax_brackets === 'string'
          ? JSON.parse(config.tax_brackets)
          : config.tax_brackets
        : [
            { upTo: 2000, rate: 0.0, deduct: 0 },
            { upTo: 4000, rate: 0.15, deduct: 300 },
            { upTo: 14000, rate: 0.2, deduct: 500 },
            { upTo: 20000, rate: 0.25, deduct: 1200 },
            { upTo: 30000, rate: 0.3, deduct: 2200 },
            { upTo: 40000, rate: 0.35, deduct: 4050 },
            { upTo: null, rate: 0.35, deduct: 2050 },
          ];
    const pensionRate = parseFloat(String(config?.employee_pension_rate ?? 7));
    const pension = Math.round(gross * (pensionRate / 100) * 100) / 100;
    const tax = this.ethiopianTax(gross, brackets);
    return Math.round(Math.max(0, gross - pension - tax) * 100) / 100;
  }

  /**
   * Net → Gross (MONTHLY): binary-search the gross that nets to `targetNet`
   * using the company's active dynamic tax + pension rules.
   */
  private async netToGrossMonthly(
    companyId: number,
    targetNet: number,
  ): Promise<number> {
    let lo = targetNet;
    let hi = targetNet * 2 + 5000;
    let gross = targetNet;
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      const net = await this.grossToNetMonthly(companyId, mid);
      if (Math.abs(net - targetNet) < 0.01) {
        gross = mid;
        break;
      }
      if (net < targetNet) lo = mid;
      else hi = mid;
      gross = mid;
    }
    return Math.round(gross * 100) / 100;
  }

  /**
   * Resolve the salary fields from the DTO:
   * - If gross (baseSalary) provided → keep it, derive daily/hourly
   * - If netSalary provided AND no gross → back-calc gross via dynamic rules,
   *   then derive daily/hourly from the resolved gross
   * - If only dailyRate/hourlyRate provided → derive monthly gross by convention
   */
  private async resolveSalary(
    companyId: number,
    dto: Partial<CreateEmployeeDto>,
  ): Promise<{
    baseSalary?: number;
    dailyRate?: number;
    hourlyRate?: number;
  }> {
    const explicitGross = dto.baseSalary
      ? parseFloat(String(dto.baseSalary))
      : undefined;
    const explicitNet = dto.netSalary
      ? parseFloat(String(dto.netSalary))
      : undefined;

    let gross = explicitGross;
    if (!gross && explicitNet) {
      gross = await this.netToGrossMonthly(companyId, explicitNet);
    }
    if (!gross && dto.dailyRate) {
      gross = parseFloat(String(dto.dailyRate)) * 22;
    }
    if (!gross && dto.hourlyRate) {
      gross = parseFloat(String(dto.hourlyRate)) * 22 * 8;
    }

    const dailyRate = dto.dailyRate
      ? parseFloat(String(dto.dailyRate))
      : gross
        ? Math.round((gross / 22) * 100) / 100
        : undefined;
    const hourlyRate = gross
      ? Math.round((gross / (22 * 8)) * 100) / 100
      : undefined;

    return {
      ...(gross !== undefined && { baseSalary: gross }),
      ...(dailyRate !== undefined && { dailyRate }),
      ...(hourlyRate !== undefined && { hourlyRate }),
    };
  }

  // Internal helper to fetch the created employee with linked user info
  private async findOneAfterCreate(id: number) {
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT e.*, json_build_object('id', u.id, 'name', u.name, 'email', u.email, 'role', u.role) AS user
       FROM finsync.employees e
       LEFT JOIN finsync."User" u ON u.id = e."userId"
       WHERE e.id = ${id}`,
    );
    return rows[0];
  }

  /**
   * Update an employee. Also syncs a linked staff User/CompanyMember:
   *   - If role is provided and NO linked user exists → auto-create staff account
   *   - If role is provided and linked user exists → update User.role + CompanyMember.role
   *   - Always syncs name/email/phone to the linked User when present
   */
  async update(
    id: number,
    dto: Partial<CreateEmployeeDto & { role?: SystemRole }>,
  ) {
    return this.prisma.$transaction(async (prisma) => {
      const existing = await prisma.employee.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException('Employee not found');

      // Determine if we need to create a staff account (role provided, no linked user)
      const willCreateStaff = dto.role && !existing.userId;
      const willSyncStaff = !willCreateStaff && existing.userId;

      // If role provided and no staff exists → create User + CompanyMember
      if (willCreateStaff) {
        const email = (dto.email ?? existing.email)?.trim()
          ? (dto.email ?? existing.email)!
          : `${existing.firstName.toLowerCase()}.${existing.lastName.toLowerCase()}@${existing.companyId}.emp.local`;

        const hashedPassword = await bcrypt.hash(
          (dto as any).password || 'ChangeMe123!',
          10,
        );

        const newUser = await prisma.user.create({
          data: {
            name: `${dto.firstName ?? existing.firstName} ${dto.lastName ?? existing.lastName}`.trim(),
            email,
            password: hashedPassword,
            phone: dto.phone ?? existing.phone ?? undefined,
            role: dto.role!,
          },
        });

        const existingMember = await prisma.companyMember.findFirst({
          where: { userId: newUser.id, companyId: existing.companyId },
        });
        if (!existingMember) {
          await prisma.companyMember.create({
            data: {
              userId: newUser.id,
              companyId: existing.companyId,
              role: dto.role!,
            },
          });
        }

        // Now update the employee with the linked userId
        await prisma.employee.update({
          where: { id },
          data: {
            userId: newUser.id,
            ...(dto.firstName && { firstName: dto.firstName }),
            ...(dto.lastName && { lastName: dto.lastName }),
            ...(dto.email !== undefined && { email: dto.email }),
            ...(dto.phone !== undefined && { phone: dto.phone }),
            ...(dto.designation && { designation: dto.designation }),
            ...(dto.employmentType && { employmentType: dto.employmentType }),
            ...(dto.baseSalary !== undefined && { baseSalary: dto.baseSalary }),
            ...(dto.hourlyRate !== undefined && { hourlyRate: dto.hourlyRate }),
            ...(dto.dailyRate !== undefined && { dailyRate: dto.dailyRate }),
            ...(dto.isActive !== undefined && { isActive: dto.isActive }),
            ...(dto.joinedDate && { joinedDate: new Date(dto.joinedDate) }),
          },
        });

        return this.findOneAfterCreate(id);
      }

      // Existing employee → build update payload
      // Gross ⇄ Net resolution on update (when netSalary/payFrequency provided)
      const salary = await this.resolveSalary(existing.companyId, dto);

      const empSets: string[] = ['"updated_at" = NOW()'];
      if (dto.payFrequency)
        empSets.push(`"payFrequency" = '${dto.payFrequency}'`);
      if (dto.baseSalary !== undefined)
        empSets.push(
          `"baseSalary" = ${salary.baseSalary ?? dto.baseSalary ?? 'NULL'}`,
        );
      if (dto.dailyRate !== undefined)
        empSets.push(
          `"dailyRate" = ${salary.dailyRate ?? dto.dailyRate ?? 'NULL'}`,
        );
      if (dto.hourlyRate !== undefined)
        empSets.push(
          `"hourlyRate" = ${salary.hourlyRate ?? dto.hourlyRate ?? 'NULL'}`,
        );
      if (dto.netSalary !== undefined)
        empSets.push(`"baseSalary" = ${salary.baseSalary ?? 'NULL'}`);
      if (dto.netSalary !== undefined)
        empSets.push(`"dailyRate" = ${salary.dailyRate ?? 'NULL'}`);
      if (dto.netSalary !== undefined)
        empSets.push(`"hourlyRate" = ${salary.hourlyRate ?? 'NULL'}`);
      if (dto.employeeCode)
        empSets.push(`"employeeCode" = '${dto.employeeCode}'`);
      if (dto.firstName) empSets.push(`"firstName" = '${dto.firstName}'`);
      if (dto.lastName) empSets.push(`"lastName" = '${dto.lastName}'`);
      if (dto.email !== undefined)
        empSets.push(`email = ${dto.email ? `'${dto.email}'` : 'NULL'}`);
      if (dto.phone !== undefined)
        empSets.push(`phone = ${dto.phone ? `'${dto.phone}'` : 'NULL'}`);
      if (dto.designation) empSets.push(`designation = '${dto.designation}'`);
      if (dto.employmentType)
        empSets.push(`"employmentType" = '${dto.employmentType}'`);
      if (dto.isActive !== undefined)
        empSets.push(`"isActive" = ${dto.isActive}`);
      if (dto.joinedDate) empSets.push(`"joinedDate" = '${dto.joinedDate}'`);

      await this.prisma.$executeRawUnsafe(
        `UPDATE finsync.employees SET ${empSets.join(', ')} WHERE id = ${id}`,
      );

      // Sync linked staff (User + CompanyMember) if one exists
      if (willSyncStaff) {
        const userData: any = {};
        if (dto.firstName || dto.lastName) {
          const firstName = dto.firstName ?? existing.firstName;
          const lastName = dto.lastName ?? existing.lastName;
          userData.name = `${firstName} ${lastName}`.trim();
        }
        if (dto.email !== undefined) userData.email = dto.email ?? undefined;
        if (dto.phone !== undefined) userData.phone = dto.phone ?? undefined;
        if (dto.role) userData.role = dto.role;

        if (Object.keys(userData).length > 0) {
          await prisma.user.update({
            where: { id: existing.userId! },
            data: userData,
          });
        }

        // Update CompanyMember role if role changed
        if (dto.role) {
          const member = await prisma.companyMember.findFirst({
            where: { userId: existing.userId!, companyId: existing.companyId },
          });
          if (member && member.role !== dto.role) {
            await prisma.companyMember.update({
              where: { id: member.id },
              data: { role: dto.role },
            });
          }
        }
      }

      return this.findOneAfterCreate(id);
    });
  }

  async remove(id: number) {
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM finsync.employees WHERE id = ${id}`,
    );
    return { id, deleted: true };
  }
}
