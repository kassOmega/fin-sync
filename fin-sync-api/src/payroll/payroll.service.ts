import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LedgerService } from '../ledger/ledger.service';
import { PrismaService } from '../prisma/prisma.service';
import { DeductionsService } from './deductions.service';

@Injectable()
export class PayrollService {
  constructor(
    private prisma: PrismaService,
    private ledger: LedgerService,
    private deductions: DeductionsService,
  ) {}

  /**
   * Resolve the Chart-of-Accounts account ids used by the payroll workflow
   * from the company's own COA (configurable — falls back to classic codes).
   * Looks up the actual ids so payroll honors admin-configured accounts.
   */
  private async getPayrollAccountIds(companyId: number) {
    const rows: { id: number; code: string }[] =
      await this.prisma.$queryRawUnsafe(
        `SELECT id, code FROM finsync.accounts
         WHERE company_id = ${companyId}
           AND code IN ('5101','2200','1001')`,
      );
    const byCode = new Map<string, number>();
    for (const r of rows) byCode.set(r.code, r.id);
    return {
      wageExpenseId: byCode.get('5101') ?? null, // Salaries & Wages
      salariesPayableId: byCode.get('2200') ?? null, // Salaries Payable
      cashId: byCode.get('1001') ?? null, // Cash/Bank
    };
  }

  async findAll(
    companyId: number,
    filters?: {
      projectId?: number;
      status?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const pf = filters?.projectId
      ? `AND p."projectId" = ${filters.projectId}`
      : '';
    const sf = filters?.status ? `AND p.status = '${filters.status}'` : '';
    const sdf = filters?.startDate
      ? `AND p."startDate" >= '${filters.startDate}'`
      : '';
    const edf = filters?.endDate
      ? `AND p."endDate" <= '${filters.endDate}'`
      : '';
    return this.prisma.$queryRawUnsafe(
      `SELECT p.* FROM finsync.payrolls p
       WHERE p."companyId" = ${companyId} ${pf} ${sf} ${sdf} ${edf}
       ORDER BY p."created_at" DESC`,
    );
  }

  /**
   * Strict duplicate protection: reject payroll generation when the requested
   * period overlaps ANY existing (non-voided) payroll for this company —
   * whether created from a company or project workspace. Payrolls are
   * company-centralized, so this prevents an employee from being paid twice
   * for the same dates via overlapping runs at any scope.
   */
  private async assertNoOverlap(
    companyId: number,
    startDate: string,
    endDate: string,
    excludeId?: number,
  ) {
    const overlap: { cnt: string }[] = await this.prisma.$queryRawUnsafe(
      `SELECT COUNT(*) AS cnt
       FROM finsync.payrolls
       WHERE "companyId" = ${companyId}
         AND status <> 'VOIDED'
         AND "startDate" <= '${endDate}'
         AND "endDate" >= '${startDate}'
         AND id <> ${excludeId ?? 0}`,
    );
    const count = parseInt(overlap[0]?.cnt || '0', 10);
    if (count > 0) {
      throw new BadRequestException(
        `Payroll overlap detected: a payroll already covers this date range (${startDate} → ${endDate}) for this company. ` +
          `Regenerating would double-pay employees. Void or delete the overlapping payroll first.`,
      );
    }
  }

  async generate(companyId: number, dto: any) {
    // Reject overlapping payroll runs before doing any work
    await this.assertNoOverlap(companyId, dto.startDate, dto.endDate);

    const pid = dto.projectId ?? 'NULL';
    const sourceType = dto.sourceType || 'ALL'; // ATTENDANCE | TIMESHEETS | ALL

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO finsync.payrolls ("companyId", "projectId", title, "sourceType", "startDate", "endDate", status, "created_at", "updated_at")
       VALUES (${companyId}, ${pid}, '${dto.title}', '${sourceType}', '${dto.startDate}', '${dto.endDate}', 'DRAFT', NOW(), NOW())`,
    );

    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM finsync.payrolls ORDER BY id DESC LIMIT 1`,
    );
    const payroll = rows[0];

    let totalAmount = 0;
    let itemsGenerated = 0;

    // ── 1. Attendance-based pay for FULL_TIME employees (skip if sourceType = TIMESHEETS) ──
    const fullTimeEmployees: any[] =
      sourceType === 'TIMESHEETS'
        ? []
        : await this.prisma.$queryRawUnsafe(
            `SELECT * FROM finsync.employees
             WHERE "companyId" = ${companyId} AND "employmentType" = 'FULL_TIME' AND "isActive" = true`,
          );

    for (const e of fullTimeEmployees) {
      // Count PRESENT attendance days within the payroll date range
      const attRows: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as present_days
         FROM finsync.attendances
         WHERE "employeeId" = ${e.id}
           AND "companyId" = ${companyId}
           AND status = 'PRESENT'
           AND date >= '${dto.startDate}'
           AND date <= '${dto.endDate}'`,
      );
      const presentDays = parseInt(attRows[0]?.present_days || '0', 10);
      if (presentDays <= 0) continue;

      // Base pay = dailyRate × presentDays (fallback: baseSalary / 22 per day)
      let dailyRate = parseFloat(String(e.dailyRate || 0));
      if (!dailyRate && e.baseSalary) {
        dailyRate = parseFloat(String(e.baseSalary)) / 22;
      }
      const basePay = dailyRate * presentDays;
      const overtimePay = 0; // Full-time OT comes from OvertimeEntry table

      // ── Consolidated Overtime Earnings (approved OvertimeEntry in period) ──
      const otRows: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT COALESCE(SUM(amount), 0) as total_ot
         FROM finsync.overtime_entries
         WHERE "employeeId" = ${e.id}
           AND "companyId" = ${companyId}
           AND status = 'APPROVED'
           AND date >= '${dto.startDate}'
           AND date <= '${dto.endDate}'`,
      );
      const overtimeEarnings = parseFloat(otRows[0]?.total_ot || '0');

      // ── Active Allowances in period (effectiveDate <= end, expiryDate >= start, isActive) ──
      const allowanceRows: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT COALESCE(SUM(CASE WHEN "isTaxable" = true THEN amount ELSE 0 END), 0) as taxable_amt,
                COALESCE(SUM(CASE WHEN "isTaxable" = false THEN amount ELSE 0 END), 0) as non_taxable_amt
         FROM finsync.payroll_allowances
         WHERE "employeeId" = ${e.id}
           AND "companyId" = ${companyId}
           AND "isActive" = true
           AND "effectiveDate" <= '${dto.endDate}'
           AND ("expiryDate" IS NULL OR "expiryDate" >= '${dto.startDate}')`,
      );
      const taxableAllowances = parseFloat(
        allowanceRows[0]?.taxable_amt || '0',
      );
      const nonTaxableAllowances = parseFloat(
        allowanceRows[0]?.non_taxable_amt || '0',
      );
      const allowanceTotal = taxableAllowances + nonTaxableAllowances;

      // ── Active Bonuses in period ──
      const bonusRows: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT COALESCE(SUM(amount), 0) as total_bonus
         FROM finsync.payroll_bonuses
         WHERE "employeeId" = ${e.id}
           AND "companyId" = ${companyId}
           AND "isActive" = true
           AND "effectiveDate" <= '${dto.endDate}'
           AND ("expiryDate" IS NULL OR "expiryDate" >= '${dto.startDate}')`,
      );
      const bonusTotal = parseFloat(bonusRows[0]?.total_bonus || '0');

      const grossPay = basePay + overtimeEarnings + allowanceTotal + bonusTotal;

      // Compute deductions — taxable income excludes non-taxable allowances
      const deductionResult = await this.deductions.computeDeductions(
        companyId,
        e.id,
        grossPay - nonTaxableAllowances,
        dto.startDate,
        dto.endDate,
      );
      const taxAmount = deductionResult.taxAmount;

      // ── Active Withholdings in period (per-employee + company-global) ──
      // FIXED → amount as-is; PERCENTAGE → grossPay × (amount/100)
      const withRows: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT COALESCE(SUM(
           CASE WHEN "calcType" = 'PERCENTAGE' THEN (${grossPay} * amount / 100.0)
                ELSE amount END
         ), 0) as total_withholding
         FROM finsync.payroll_withholdings
         WHERE "companyId" = ${companyId}
           AND "isActive" = true
           AND ("employeeId" = ${e.id} OR "isGlobal" = true)
           AND "effectiveDate" <= '${dto.endDate}'
           AND ("expiryDate" IS NULL OR "expiryDate" >= '${dto.startDate}')`,
      );
      const withholdingTotal = parseFloat(
        withRows[0]?.total_withholding || '0',
      );

      const totalDeductions =
        deductionResult.totalDeductions + withholdingTotal;
      const netPay = Math.max(0, grossPay - totalDeductions);

      // Insert payroll item with full breakdown
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO finsync.payroll_items ("payrollId", "employeeId", "basePay", "overtimeEarnings", "overtimePay", "allowanceTotal", "bonusTotal", "grossPay", "totalDeductions", "withholdingTotal", "netPay", "unpaidLeaveDays", "unpaidLeaveDeduction", "taxAmount")
         VALUES (${payroll.id}, ${e.id}, ${basePay}, ${overtimeEarnings}, ${overtimePay}, ${allowanceTotal}, ${bonusTotal}, ${grossPay}, ${totalDeductions}, ${withholdingTotal}, ${netPay}, ${deductionResult.unpaidLeaveDays}, ${deductionResult.unpaidLeaveDeduction}, ${taxAmount})`,
      );

      // Get the payroll item ID
      const itemRows: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT id FROM finsync.payroll_items WHERE "payrollId" = ${payroll.id} AND "employeeId" = ${e.id} ORDER BY id DESC LIMIT 1`,
      );

      // Link approved overtime entries to this payroll item
      if (itemRows.length) {
        await this.prisma.$executeRawUnsafe(
          `UPDATE finsync.overtime_entries SET "payrollItemId" = ${itemRows[0].id}
           WHERE "employeeId" = ${e.id} AND "companyId" = ${companyId}
             AND status = 'APPROVED'
             AND date >= '${dto.startDate}' AND date <= '${dto.endDate}'`,
        );
      }

      // Link active allowances to this payroll item
      if (itemRows.length && allowanceTotal > 0) {
        await this.prisma.$executeRawUnsafe(
          `UPDATE finsync.payroll_allowances SET "payrollItemId" = ${itemRows[0].id}
           WHERE "employeeId" = ${e.id} AND "companyId" = ${companyId}
             AND "isActive" = true AND "payrollItemId" IS NULL
             AND "effectiveDate" <= '${dto.endDate}'
             AND ("expiryDate" IS NULL OR "expiryDate" >= '${dto.startDate}')`,
        );
      }

      // Link active bonuses to this payroll item
      if (itemRows.length && bonusTotal > 0) {
        await this.prisma.$executeRawUnsafe(
          `UPDATE finsync.payroll_bonuses SET "payrollItemId" = ${itemRows[0].id}
           WHERE "employeeId" = ${e.id} AND "companyId" = ${companyId}
             AND "isActive" = true AND "payrollItemId" IS NULL
             AND "effectiveDate" <= '${dto.endDate}'
             AND ("expiryDate" IS NULL OR "expiryDate" >= '${dto.startDate}')`,
        );
      }

      // Link active withholdings to this payroll item (per-employee + company-global)
      if (itemRows.length && withholdingTotal > 0) {
        await this.prisma.$executeRawUnsafe(
          `UPDATE finsync.payroll_withholdings SET "payrollItemId" = ${itemRows[0].id}
           WHERE "companyId" = ${companyId}
             AND ("employeeId" = ${e.id} OR "isGlobal" = true)
             AND "isActive" = true AND "payrollItemId" IS NULL
             AND "effectiveDate" <= '${dto.endDate}'
             AND ("expiryDate" IS NULL OR "expiryDate" >= '${dto.startDate}')`,
        );
      }

      // Insert deduction breakdown (regular rules + withholdings for audit)
      if (itemRows.length) {
        for (const d of deductionResult.deductions) {
          await this.prisma.$executeRawUnsafe(
            `INSERT INTO finsync.payroll_item_deductions ("payrollItemId", name, amount, type)
             VALUES (${itemRows[0].id}, '${d.name.replace(/'/g, "''")}', ${d.amount}, '${d.type}')`,
          );
        }
        if (withholdingTotal > 0) {
          const withDetail: any[] = await this.prisma.$queryRawUnsafe(
            `SELECT wt.name, wt.type, wt.amount, wt.reason FROM finsync.payroll_withholdings wt
             WHERE wt."companyId" = ${companyId}
               AND (wt."employeeId" = ${e.id} OR wt."isGlobal" = true)
               AND wt."isActive" = true
               AND wt."effectiveDate" <= '${dto.endDate}'
               AND (wt."expiryDate" IS NULL OR wt."expiryDate" >= '${dto.startDate}')`,
          );
          for (const w of withDetail) {
            const amount =
              w.calcType === 'PERCENTAGE'
                ? (grossPay * parseFloat(String(w.amount))) / 100
                : parseFloat(String(w.amount));
            const label = `${w.name || w.type}${w.reason ? `: ${String(w.reason).replace(/'/g, "''")}` : ''}`;
            await this.prisma.$executeRawUnsafe(
              `INSERT INTO finsync.payroll_item_deductions ("payrollItemId", name, amount, type)
               VALUES (${itemRows[0].id}, '${String(label).replace(/'/g, "''")}', ${amount}, 'WITHHOLDING')`,
            );
          }
        }
      }

      totalAmount += netPay;
      itemsGenerated++;
    }

    // ── 2. Hourly/daily workers from APPROVED timesheets (skip if sourceType = ATTENDANCE) ──
    const pf = dto.projectId ? `AND t."projectId" = ${dto.projectId}` : '';
    const timesheets: any[] =
      sourceType === 'ATTENDANCE'
        ? []
        : await this.prisma.$queryRawUnsafe(
            `SELECT t."employeeId", SUM(t."regularHours") as total_regular, SUM(t."overtimeHours") as total_overtime
             FROM finsync.timesheets t
             JOIN finsync.employees e ON e.id = t."employeeId"
             WHERE t."companyId" = ${companyId} AND t.status = 'APPROVED'
               AND e."employmentType" != 'FULL_TIME'
               AND t.date >= '${dto.startDate}' AND t.date <= '${dto.endDate}' ${pf}
             GROUP BY t."employeeId"`,
          );

    for (const ts of timesheets) {
      const emp: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT * FROM finsync.employees WHERE id = ${ts.employeeId}`,
      );
      if (!emp.length) continue;
      const e = emp[0];

      const reg = parseFloat(String(ts.total_regular || 0));
      const ot = parseFloat(String(ts.total_overtime || 0));
      const rate = parseFloat(String(e.hourlyRate || 0));
      const basePay = reg * rate;
      const overtimePay = ot * rate * 1.5;
      const overtimeEarnings = ot * rate * 1.5;
      const grossPay = basePay + overtimePay;

      const deductionResult = await this.deductions.computeDeductions(
        companyId,
        ts.employeeId,
        grossPay,
        dto.startDate,
        dto.endDate,
      );

      const netPay = Math.max(0, grossPay - deductionResult.totalDeductions);

      await this.prisma.$executeRawUnsafe(
        `INSERT INTO finsync.payroll_items ("payrollId", "employeeId", "basePay", "overtimeEarnings", "overtimePay", "grossPay", "totalDeductions", "netPay", "unpaidLeaveDays", "unpaidLeaveDeduction", "taxAmount")
         VALUES (${payroll.id}, ${ts.employeeId}, ${basePay}, ${overtimeEarnings}, ${overtimePay}, ${grossPay}, ${deductionResult.totalDeductions}, ${netPay}, ${deductionResult.unpaidLeaveDays}, ${deductionResult.unpaidLeaveDeduction}, ${deductionResult.taxAmount})`,
      );

      const itemRows: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT id FROM finsync.payroll_items WHERE "payrollId" = ${payroll.id} AND "employeeId" = ${ts.employeeId} ORDER BY id DESC LIMIT 1`,
      );

      if (itemRows.length && deductionResult.deductions.length > 0) {
        for (const d of deductionResult.deductions) {
          await this.prisma.$executeRawUnsafe(
            `INSERT INTO finsync.payroll_item_deductions ("payrollItemId", name, amount, type)
             VALUES (${itemRows[0].id}, '${d.name.replace(/'/g, "''")}', ${d.amount}, '${d.type}')`,
          );
        }
      }

      totalAmount += netPay;
    }

    await this.prisma.$executeRawUnsafe(
      `UPDATE finsync.payrolls SET "totalAmount" = ${totalAmount} WHERE id = ${payroll.id}`,
    );

    const totalItems = itemsGenerated + timesheets.length;

    return { ...payroll, totalAmount, itemsGenerated: totalItems };
  }

  async approve(payrollId: number) {
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM finsync.payrolls WHERE id = ${payrollId}`,
    );
    if (!rows.length) throw new NotFoundException('Payroll not found');
    const p = rows[0];

    await this.prisma.$executeRawUnsafe(
      `UPDATE finsync.payrolls SET status = 'APPROVED', "updated_at" = NOW() WHERE id = ${payrollId}`,
    );

    const amount = parseFloat(String(p.totalAmount || 0));
    if (amount > 0) {
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO finsync."CompanyExpense" (company_id, registered_by, amount, category, date, note, project_id, payroll_expense_id, "createdAt", is_recurring, recurring_frequency)
         VALUES (${p.companyId}, ${p.companyId}, ${amount}, 'Payroll', NOW(), 'Payroll: ${p.title}', ${p.projectId ?? 'NULL'}, ${payrollId}, NOW(), false, NULL)`,
      );

      const expRows: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT id FROM finsync."CompanyExpense" WHERE payroll_expense_id = ${payrollId} ORDER BY id DESC LIMIT 1`,
      );
      if (expRows.length) {
        await this.prisma.$executeRawUnsafe(
          `UPDATE finsync.payrolls SET "expenseId" = ${expRows[0].id} WHERE id = ${payrollId}`,
        );
      }

      try {
        const acc = await this.getPayrollAccountIds(p.companyId);
        await this.ledger.createAutoEntry(p.companyId, {
          sourceType: 'PAYROLL',
          sourceId: payrollId,
          description: `Payroll: ${p.title}`,
          date: new Date(),
          projectId: p.projectId ?? undefined,
          lines: [
            {
              ...(acc.wageExpenseId
                ? { accountId: acc.wageExpenseId }
                : { accountCode: '5101' }),
              description: 'Salaries & Wages',
              debit: amount,
              credit: 0,
            },
            {
              ...(acc.salariesPayableId
                ? { accountId: acc.salariesPayableId }
                : { accountCode: '2200' }),
              description: 'Salaries Payable',
              debit: 0,
              credit: amount,
            },
          ],
        });
      } catch {}
    }

    return { approved: true, id: payrollId, expenseCreated: amount > 0 };
  }

  /**
   * Mark a payroll as PAID:
   *  - Sets status = 'PAID'
   *  - Ensures a CompanyExpense is registered for the run
   *  - Posts the settlement journal entry: Debit 2200 Salaries Payable / Credit 1001 Cash
   */
  async markPaid(payrollId: number) {
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM finsync.payrolls WHERE id = ${payrollId}`,
    );
    if (!rows.length) throw new NotFoundException('Payroll not found');
    const p = rows[0];
    if (p.status !== 'APPROVED') {
      throw new BadRequestException(
        'Only APPROVED payrolls can be marked PAID',
      );
    }

    const amount = parseFloat(String(p.totalAmount || 0));

    // 1. Mark as PAID
    await this.prisma.$executeRawUnsafe(
      `UPDATE finsync.payrolls SET status = 'PAID', "updated_at" = NOW() WHERE id = ${payrollId}`,
    );

    // 2. Ensure a CompanyExpense record exists (auto-register when status → PAID)
    if (amount > 0) {
      const expCheck: { id: number }[] = await this.prisma.$queryRawUnsafe(
        `SELECT id FROM finsync."CompanyExpense" WHERE payroll_expense_id = ${payrollId} LIMIT 1`,
      );
      if (expCheck.length === 0) {
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO finsync."CompanyExpense" (company_id, registered_by, amount, category, date, note, project_id, payroll_expense_id, "createdAt", is_recurring, recurring_frequency)
           VALUES (${p.companyId}, ${p.companyId}, ${amount}, 'Payroll', NOW(), 'Payroll (PAID): ${p.title}', ${p.projectId ?? 'NULL'}, ${payrollId}, NOW(), false, NULL)`,
        );
      }

      // 3. Settlement journal entry: reverse payable → cash out
      try {
        const acc = await this.getPayrollAccountIds(p.companyId);
        await this.ledger.createAutoEntry(p.companyId, {
          sourceType: 'PAYROLL',
          sourceId: payrollId,
          description: `Payroll PAID: ${p.title}`,
          date: new Date(),
          projectId: p.projectId ?? undefined,
          lines: [
            {
              ...(acc.salariesPayableId
                ? { accountId: acc.salariesPayableId }
                : { accountCode: '2200' }),
              description: 'Settle Salaries Payable',
              debit: amount,
              credit: 0,
            },
            {
              ...(acc.cashId
                ? { accountId: acc.cashId }
                : { accountCode: '1001' }),
              description: 'Cash/Bank payment',
              debit: 0,
              credit: amount,
            },
          ],
        });
      } catch {
        // Ledger sync must not block the PAID transition
      }
    }

    return { paid: true, id: payrollId, amount };
  }

  /**
   * Unified compensation registry: one row per employee across ALL
   * non-voided payrolls for the company (any project scope). This is the
   * cross-referencing check for duplicate-fee prevention — base salary,
   * overtime, allowances, bonuses are summed so administrators can verify
   * an employee has not been paid twice for overlapping periods.
   */
  async getCompensationRegistry(companyId: number) {
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT
        e.id AS "employeeId",
        e."firstName",
        e."lastName",
        e."employeeCode",
        COUNT(DISTINCT pi."payrollId") AS "payrollCount",
        COALESCE(SUM(pi."basePay"), 0) AS "totalBase",
        COALESCE(SUM(pi."overtimeEarnings"), 0) AS "totalOvertime",
        COALESCE(SUM(pi."allowanceTotal"), 0) AS "totalAllowances",
        COALESCE(SUM(pi."bonusTotal"), 0) AS "totalBonuses",
        COALESCE(SUM(pi."grossPay"), 0) AS "totalGross",
        COALESCE(SUM(pi."totalDeductions"), 0) AS "totalDeductions",
        COALESCE(SUM(pi."netPay"), 0) AS "totalNet"
       FROM finsync.payroll_items pi
       JOIN finsync.employees e ON e.id = pi."employeeId"
       JOIN finsync.payrolls p ON p.id = pi."payrollId"
       WHERE p."companyId" = ${companyId} AND p.status <> 'VOIDED'
       GROUP BY e.id, e."firstName", e."lastName", e."employeeCode"
       ORDER BY e."lastName", e."firstName"`,
    );
    return rows.map((r) => ({
      employeeId: r.employeeId,
      firstName: r.firstName,
      lastName: r.lastName,
      employeeCode: r.employeeCode,
      payrollCount: parseInt(r.payrollCount || '0', 10),
      totalBase: parseFloat(r.totalBase || 0),
      totalOvertime: parseFloat(r.totalOvertime || 0),
      totalAllowances: parseFloat(r.totalAllowances || 0),
      totalBonuses: parseFloat(r.totalBonuses || 0),
      totalGross: parseFloat(r.totalGross || 0),
      totalDeductions: parseFloat(r.totalDeductions || 0),
      totalNet: parseFloat(r.totalNet || 0),
    }));
  }

  /**
   * Audit cross-reference between project financial logs and the central
   * company ledger. Each payroll row shows its project scope, the linked
   * company expense (payroll_expense_id) and journal source so admins can
   * verify allocation without double-dipping.
   */
  async getPayrollAudit(companyId: number, projectId?: number) {
    const pf = projectId ? `AND p."projectId" = ${projectId}` : '';
    return this.prisma.$queryRawUnsafe(
      `SELECT
        p.id,
        p.title,
        p."startDate",
        p."endDate",
        p.status,
        p."projectId",
        prj.name AS "projectName",
        p."expenseId",
        ce.amount AS "expenseAmount",
        ce.note AS "expenseNote",
        CASE WHEN j.id IS NULL THEN 'NO_JOURNAL' ELSE 'POSTED' END AS "ledgerStatus",
        j."entryNumber" AS "journalEntry",
        j."sourceType" AS "journalSource"
       FROM finsync.payrolls p
       LEFT JOIN finsync."projects" prj ON prj.id = p."projectId"
       LEFT JOIN finsync."CompanyExpense" ce ON ce.payroll_expense_id = p.id
       LEFT JOIN finsync.journal_entries j ON j."sourceType" = 'PAYROLL' AND j."sourceId" = p.id
       WHERE p."companyId" = ${companyId} AND p.status <> 'VOIDED' ${pf}
       ORDER BY p."startDate" DESC, p.id DESC`,
    );
  }

  async getItems(payrollId: number) {
    return this.prisma.$queryRawUnsafe(
      `SELECT pi.*, json_build_object('id', e.id, 'firstName', e."firstName", 'lastName', e."lastName", 'employeeCode', e."employeeCode") AS employee
       FROM finsync.payroll_items pi
       JOIN finsync.employees e ON e.id = pi."employeeId"
       WHERE pi."payrollId" = ${payrollId}`,
    );
  }

  // ─── Payslip ──────────────────────────────────────────────

  async getPayslip(payrollId: number, itemId: number) {
    const itemRows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT pi.*, json_build_object(
        'id', e.id, 'firstName', e."firstName", 'lastName', e."lastName",
        'employeeCode', e."employeeCode", 'designation', e.designation
      ) AS employee
       FROM finsync.payroll_items pi
       JOIN finsync.employees e ON e.id = pi."employeeId"
       WHERE pi.id = ${itemId} AND pi."payrollId" = ${payrollId}`,
    );
    if (!itemRows.length) throw new NotFoundException('Payroll item not found');
    const item = itemRows[0];

    const payrollRows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT p.*, json_build_object('name', c.name, 'currency', c.currency) AS company
       FROM finsync.payrolls p
       JOIN finsync."Company" c ON c.id = p."companyId"
       WHERE p.id = ${payrollId}`,
    );

    const deductions: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM finsync.payroll_item_deductions WHERE "payrollItemId" = ${itemId}`,
    );

    return {
      employee: item.employee,
      payroll: {
        title: payrollRows[0]?.title,
        startDate: payrollRows[0]?.startDate,
        endDate: payrollRows[0]?.endDate,
        status: payrollRows[0]?.status,
      },
      earnings: {
        basePay: parseFloat(item.basePay || 0),
        overtimeEarnings: parseFloat(item.overtimeEarnings || 0),
        overtimePay: parseFloat(item.overtimePay || 0),
        allowanceTotal: parseFloat(item.allowanceTotal || 0),
        bonusTotal: parseFloat(item.bonusTotal || 0),
        grossPay: parseFloat(item.grossPay || 0),
      },
      deductions: deductions.map((d: any) => ({
        name: d.name,
        amount: parseFloat(d.amount || 0),
        type: d.type,
      })),
      summary: {
        totalDeductions: parseFloat(item.totalDeductions || 0),
        withholdingTotal: parseFloat(item.withholdingTotal || 0),
        netPay: parseFloat(item.netPay || 0),
        unpaidLeaveDays: parseFloat(item.unpaidLeaveDays || 0),
        taxAmount: parseFloat(item.taxAmount || 0),
      },
      company: payrollRows[0]?.company || {},
    };
  }
}
