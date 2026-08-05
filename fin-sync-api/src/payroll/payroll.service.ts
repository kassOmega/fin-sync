import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DailyLaborersService } from '../daily-laboreers/daily-laboreers.service';
import { LedgerService } from '../ledger/ledger.service';
import { PrismaService } from '../prisma/prisma.service';
import { DeductionsService } from './deductions.service';

@Injectable()
export class PayrollService {
  constructor(
    private prisma: PrismaService,
    private ledger: LedgerService,
    private deductions: DeductionsService,
    private dailyLaborers: DailyLaborersService,
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
      `SELECT p.*,
              (SELECT COUNT(*)::int FROM finsync.payroll_items pi
               WHERE pi."payrollId" = p.id) AS "itemsGenerated"
       FROM finsync.payrolls p
       WHERE p."companyId" = ${companyId} ${pf} ${sf} ${sdf} ${edf}
       ORDER BY p."created_at" DESC`,
    );
  }

  /**
   * Return the payroll config version effective for a given date.
   * Versioned: past runs always resolve the brackets that were active in their
   * own period, so mid-year rule changes never break historical payroll.
   */
  async getEffectivePayrollConfig(companyId: number, asOf?: Date) {
    const date = asOf ?? new Date();
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM finsync.company_payroll_config_versions
       WHERE company_id = ${companyId}
         AND effective_from <= '${date.toISOString()}'
         AND (superseded_at IS NULL OR superseded_at > '${date.toISOString()}')
       ORDER BY effective_from DESC
       LIMIT 1`,
    );
    if (rows.length > 0) return rows[0];
    // No version yet → create the Ethiopian Proclamation 1395/2025 default
    return this.createPayrollConfigVersion(
      companyId,
      {
        effectiveFrom: date,
        taxBrackets: [
          { upTo: 2000, rate: 0.0, deduct: 0 },
          { upTo: 4000, rate: 0.15, deduct: 300 },
          { upTo: 14000, rate: 0.2, deduct: 500 },
          { upTo: 20000, rate: 0.25, deduct: 1200 },
          { upTo: 30000, rate: 0.3, deduct: 2200 },
          { upTo: 40000, rate: 0.35, deduct: 4050 },
          { upTo: null, rate: 0.35, deduct: 2050 },
        ],
        employeePensionRate: 7,
        employerPensionRate: 11,
        standardAllowanceAmount: 0,
        otMultiplier: 1.5,
        defaultPayFrequency: 'MONTHLY',
      },
      undefined,
    );
  }

  async createPayrollConfigVersion(
    companyId: number,
    dto: {
      effectiveFrom: Date;
      taxBrackets: Array<{ upTo: number | null; rate: number; deduct: number }>;
      employeePensionRate: number;
      employerPensionRate: number;
      standardAllowanceAmount: number;
      otMultiplier: number;
      defaultPayFrequency: string;
    },
    createdById?: number,
  ) {
    const eff = `${dto.effectiveFrom.toISOString()}`
      .replace('T', ' ')
      .slice(0, 19);

    const bracketsJson = JSON.stringify(dto.taxBrackets).replace(/'/g, "''");

    // Upsert for this effective date: if a version already exists for the same
    // (companyId, effectiveFrom) — e.g. the UX modal defaulted to the active
    // version's date — update it in place (idempotent) instead of duplicating.
    // Only a genuinely different date creates a NEW version.
    const existing: { id: number }[] = await this.prisma.$queryRawUnsafe(
      `SELECT id FROM finsync.company_payroll_config_versions
       WHERE company_id = ${companyId} AND effective_from = '${eff}'`,
    );

    if (existing.length > 0) {
      await this.prisma.$executeRawUnsafe(
        `UPDATE finsync.company_payroll_config_versions
         SET tax_brackets = '${bracketsJson}',
             employee_pension_rate = ${dto.employeePensionRate},
             employer_pension_rate = ${dto.employerPensionRate},
             standard_allowance_amount = ${dto.standardAllowanceAmount},
             ot_multiplier = ${dto.otMultiplier},
             default_pay_frequency = '${dto.defaultPayFrequency}',
             created_by_id = ${createdById ?? 'NULL'}
         WHERE id = ${existing[0].id}`,
      );
      const updated: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT * FROM finsync.company_payroll_config_versions WHERE id = ${existing[0].id}`,
      );
      return updated[0];
    }

    // Supersede any currently-active version (audit trail: never edited in place)
    await this.prisma.$executeRawUnsafe(
      `UPDATE finsync.company_payroll_config_versions
       SET superseded_at = '${eff}'
       WHERE company_id = ${companyId}
         AND superseded_at IS NULL
         AND effective_from <= '${eff}'`,
    );

    const inserted: { id: number }[] = await this.prisma.$queryRawUnsafe(
      `INSERT INTO finsync.company_payroll_config_versions
         (company_id, effective_from, tax_brackets, employee_pension_rate, employer_pension_rate,
          standard_allowance_amount, ot_multiplier, default_pay_frequency, created_at, created_by_id)
       VALUES (${companyId}, '${eff}',
         '${bracketsJson}',
         ${dto.employeePensionRate}, ${dto.employerPensionRate},
         ${dto.standardAllowanceAmount}, ${dto.otMultiplier}, '${dto.defaultPayFrequency}',
         NOW(), ${createdById ?? 'NULL'})
       RETURNING id`,
    );

    const row: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM finsync.company_payroll_config_versions WHERE id = ${inserted[0].id}`,
    );
    return row[0];
  }

  async getPayrollConfigHistory(companyId: number) {
    return this.prisma.$queryRawUnsafe(
      `SELECT * FROM finsync.company_payroll_config_versions
       WHERE company_id = ${companyId}
       ORDER BY effective_from DESC`,
    );
  }

  /**
   * Government / statutory deduction rules passthrough (payroll_deductions).
   */
  async listDeductions(companyId: number) {
    return this.deductions.getDeductions(companyId);
  }

  async addDeduction(
    companyId: number,
    dto: { name: string; type: string; value: number },
  ) {
    return this.deductions.createDeduction(companyId, dto);
  }

  async updateDeduction(
    id: number,
    dto: { name?: string; type?: string; value?: number; isActive?: boolean },
  ) {
    return this.deductions.updateDeduction(id, dto);
  }

  async deleteDeduction(id: number) {
    return this.deductions.deleteDeduction(id);
  }

  /**
   * Rounding standard — standard arithmetic half-up to 2 decimals,
   * applied at EVERY calculation step so per-employee nets always sum
   * exactly to the payroll total and GL lines.
   */
  private roundMoney(n: number): number {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }

  /**
   * Sync approved leave into payroll (Ethiopian statutory rules).
   * - paidDays: any approved leave with LeaveType.isPaid = true → counted as
   *   working days (full salary continuity; NEVER reduces base)
   * - specialDays: fully-paid statutory special leave (maternity/paternity/
   *   marriage/bereavement) — also counted as working days
   * - unpaidDays: approved leave where LeaveType.isPaid = false → deducted
   * - sick (post-probation, after 1yr service): first 22 working days 100%,
   *   next 44 working days 50% (half-days counted), remainder unpaid
   */
  private async getApprovedLeaveBreakdown(
    companyId: number,
    employeeId: number,
    startDate: string,
    endDate: string,
    joinedDate?: Date,
  ): Promise<{
    paidDays: number;
    specialDays: number;
    unpaidDays: number;
    sickPaid100: number;
    sickPaid50: number;
    sickUnpaid: number;
  }> {
    const requests: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT lr."startDate", lr."endDate", lr."totalDays", lt.name, lt."isPaid"
       FROM finsync.leave_requests lr
       JOIN finsync.leave_types lt ON lt.id = lr."leave_type_id"
       WHERE lr.employee_id = ${employeeId}
         AND lr.company_id = ${companyId}
         AND lr.status = 'APPROVED'
         AND lr."startDate" <= '${endDate}'
         AND lr."endDate" >= '${startDate}'`,
    );

    const servicedYears = joinedDate
      ? Math.max(
          0,
          Math.floor(
            (Date.now() - new Date(joinedDate).getTime()) /
              (365.25 * 24 * 3600 * 1000),
          ),
        )
      : 0;
    // After probation (≈1yr): sick 100% first 22 days, 50% next 44, else unpaid
    const eligibleSick = servicedYears >= 1;

    let paidDays = 0;
    let specialDays = 0;
    let unpaidDays = 0;
    let sickPaid100 = 0;
    let sickPaid50 = 0;
    let sickUnpaid = 0;

    for (const req of requests) {
      // Count business days (Mon–Fri) overlapping the payroll period
      const overlapStart = new Date(
        Math.max(
          new Date(req.startDate).getTime(),
          new Date(startDate).getTime(),
        ),
      );
      const overlapEnd = new Date(
        Math.min(new Date(req.endDate).getTime(), new Date(endDate).getTime()),
      );
      if (overlapStart > overlapEnd) continue;

      let days = 0;
      const cur = new Date(overlapStart);
      while (cur <= overlapEnd) {
        const d = cur.getDay();
        if (d !== 0 && d !== 6) days++;
        cur.setDate(cur.getDate() + 1);
      }
      if (days <= 0) continue;

      const name = String(req.name || '').toLowerCase();
      const isSpecial = /maternity|paternity|marriage|bereavement/.test(name);
      if (isSpecial) {
        specialDays += days;
      } else if (/sick/i.test(name)) {
        if (!eligibleSick) {
          // Pre-probation sick leave: still paid (full continuity)
          paidDays += days;
        } else {
          const remaining100 = Math.max(0, 22 - sickPaid100);
          const take100 = Math.min(days, remaining100);
          sickPaid100 += take100;
          let rest = days - take100;
          if (rest > 0) {
            const remaining50 = Math.max(0, 44 - sickPaid50);
            const take50 = Math.min(rest, remaining50);
            sickPaid50 += take50;
            rest -= take50;
          }
          sickUnpaid += rest;
        }
      } else if (req.isPaid) {
        paidDays += days;
      } else {
        unpaidDays += days;
      }
    }

    return {
      paidDays: Math.round(paidDays),
      specialDays: Math.round(specialDays),
      unpaidDays: Math.round(unpaidDays),
      sickPaid100: Math.round(sickPaid100),
      sickPaid50: Math.round(sickPaid50),
      sickUnpaid: Math.round(sickUnpaid),
    };
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
         AND "sourceType" IN ('ALL', 'ATTENDANCE', 'TIMESHEETS')
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
      // Attendance is the source of truth for worked + leave days:
      // PRESENT = 1.0, HALF_DAY = 0.5 (approved paid leave is auto-marked PRESENT).
      const attRows: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT COALESCE(SUM(CASE WHEN status = 'PRESENT' THEN 1.0
                                  WHEN status = 'HALF_DAY' THEN 0.5
                                  ELSE 0 END), 0) AS present_days
         FROM finsync.attendances
         WHERE "employeeId" = ${e.id}
           AND "companyId" = ${companyId}
           AND status IN ('PRESENT', 'HALF_DAY')
           AND DATE(date) >= DATE('${dto.startDate}')
           AND DATE(date) <= DATE('${dto.endDate}')`,
      );
      const presentDays = parseFloat(attRows[0]?.present_days || '0');

      // Leave breakdown: used only for the sick-50% half-rate adjustment.
      // Paid/special/sick leave is already counted as PRESENT attendance;
      // unpaid leave is ON_LEAVE (excluded) and deducted via computeUnpaidLeave.
      const leave = await this.getApprovedLeaveBreakdown(
        companyId,
        e.id,
        dto.startDate,
        dto.endDate,
        e.joinedDate,
      );
      const workingDays = presentDays;
      if (workingDays <= 0) continue;

      // Rate fallback chain: dailyRate → weeklyRate/6 → baseSalary/22 → hourlyRate×8
      let dailyRate = parseFloat(String(e.dailyRate || 0));
      if (!dailyRate && e.weeklyRate) {
        dailyRate = parseFloat(String(e.weeklyRate)) / 6;
      }
      if (!dailyRate && e.baseSalary) {
        dailyRate = parseFloat(String(e.baseSalary)) / 22;
      }
      if (!dailyRate && e.hourlyRate) {
        dailyRate = parseFloat(String(e.hourlyRate)) * 8;
      }
      if (!dailyRate) continue; // no resolvable rate — skip with reason

      // Half-rate for the sick-50% band (those days are PRESENT at full weight);
      // unpaid/sick-unpaid days are excluded from workingDays, so no subtraction here.
      const basePay = this.roundMoney(
        dailyRate * (workingDays - leave.sickPaid50) +
          (dailyRate / 2) * leave.sickPaid50,
      );
      const overtimePay = 0; // Full-time OT comes from OvertimeEntry table

      // ── Consolidated Overtime Earnings (approved OvertimeEntry in period) ──
      const otRows: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT COALESCE(SUM(amount), 0) as total_ot
         FROM finsync.overtime_entries
         WHERE employee_id = ${e.id}
           AND company_id = ${companyId}
           AND status = 'APPROVED'
           AND date >= '${dto.startDate}'
           AND date <= '${dto.endDate}'`,
      );
      const overtimeEarnings = parseFloat(otRows[0]?.total_ot || '0');

      // ── Active Allowances in period (effectiveDate <= end, expiryDate >= start, isActive) ──
      const allowanceRows: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT COALESCE(SUM(CASE WHEN "isTaxable" = true THEN amount ELSE 0 END), 0) as taxable_amt,
                COALESCE(SUM(CASE WHEN "isTaxable" = false THEN amount ELSE 0 END), 0) as non_taxable_amt
         FROM finsync.employee_specific_allowances
         WHERE employee_id = ${e.id}
           AND company_id = ${companyId}
           AND "isActive" = true
           AND "effectiveDate" <= '${dto.endDate}'
           AND ("expiryDate" IS NULL OR "expiryDate" >= '${dto.startDate}')`,
      );
      let taxableAllowances = parseFloat(allowanceRows[0]?.taxable_amt || '0');
      let nonTaxableAllowances = parseFloat(
        allowanceRows[0]?.non_taxable_amt || '0',
      );

      // ── Position-based allowances (auto-applied from employee's work position) ──
      // Prorated by calendar-day overlap: amount × overlapDays / periodDays.
      // Taxable → part of gross; non-taxable → excluded from taxable base.
      if (e.positionId) {
        const posRows: any[] = await this.prisma.$queryRawUnsafe(
          `SELECT pa."isTaxable",
                  pa.amount * (
                    (EXTRACT(EPOCH FROM (
                      LEAST('${dto.endDate}'::date, COALESCE(pa."effectiveTo", '${dto.endDate}'::date))
                      - GREATEST('${dto.startDate}'::date, pa."effectiveFrom"::date)
                    )) / 86400.0 + 1)
                    / (EXTRACT(EPOCH FROM ('${dto.endDate}'::date - '${dto.startDate}'::date)) / 86400.0 + 1)
                  ) AS prorated
           FROM finsync.position_allowances pa
           WHERE pa."position_id" = ${e.positionId}
             AND pa."isActive" = true
             AND pa."effectiveFrom" <= '${dto.endDate}'
             AND (pa."effectiveTo" IS NULL OR pa."effectiveTo" >= '${dto.startDate}')`,
        );
        for (const pr of posRows) {
          const amt = this.roundMoney(parseFloat(String(pr.prorated || 0)));
          if (pr.isTaxable) taxableAllowances += amt;
          else nonTaxableAllowances += amt;
        }
      }

      const allowanceTotal = taxableAllowances + nonTaxableAllowances;

      // ── Active Bonuses in period ──
      const bonusRows: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT COALESCE(SUM(amount), 0) as total_bonus
         FROM finsync.payroll_bonuses
         WHERE employee_id = ${e.id}
           AND company_id = ${companyId}
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
         WHERE company_id = ${companyId}
           AND "isActive" = true
           AND (employee_id = ${e.id} OR "isGlobal" = true)
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
           WHERE employee_id = ${e.id} AND company_id = ${companyId}
             AND status = 'APPROVED'
             AND date >= '${dto.startDate}' AND date <= '${dto.endDate}'`,
        );
      }

      // Link active allowances to this payroll item
      if (itemRows.length && allowanceTotal > 0) {
        await this.prisma.$executeRawUnsafe(
          `UPDATE finsync.employee_specific_allowances SET "payroll_item_id" = ${itemRows[0].id}
           WHERE employee_id = ${e.id} AND company_id = ${companyId}
             AND "isActive" = true AND "payroll_item_id" IS NULL
             AND "effectiveDate" <= '${dto.endDate}'
             AND ("expiryDate" IS NULL OR "expiryDate" >= '${dto.startDate}')`,
        );
      }

      // Link active bonuses to this payroll item
      if (itemRows.length && bonusTotal > 0) {
        await this.prisma.$executeRawUnsafe(
          `UPDATE finsync.payroll_bonuses SET "payroll_item_id" = ${itemRows[0].id}
           WHERE employee_id = ${e.id} AND company_id = ${companyId}
             AND "isActive" = true AND "payroll_item_id" IS NULL
             AND "effectiveDate" <= '${dto.endDate}'
             AND ("expiryDate" IS NULL OR "expiryDate" >= '${dto.startDate}')`,
        );
      }

      // Link active withholdings to this payroll item (per-employee + company-global)
      if (itemRows.length && withholdingTotal > 0) {
        await this.prisma.$executeRawUnsafe(
          `UPDATE finsync.payroll_withholdings SET "payroll_item_id" = ${itemRows[0].id}
           WHERE company_id = ${companyId}
             AND (employee_id = ${e.id} OR "isGlobal" = true)
             AND "isActive" = true AND "payroll_item_id" IS NULL
             AND "effectiveDate" <= '${dto.endDate}'
             AND ("expiryDate" IS NULL OR "expiryDate" >= '${dto.startDate}')`,
        );
      }

      // Insert deduction breakdown (regular rules + withholdings for audit)
      if (itemRows.length) {
        for (const d of deductionResult.deductions) {
          await this.prisma.$executeRawUnsafe(
            `INSERT INTO finsync.payroll_item_deductions ("payroll_item_id", name, amount, type)
             VALUES (${itemRows[0].id}, '${d.name.replace(/'/g, "''")}', ${d.amount}, '${d.type}')`,
          );
        }
        if (withholdingTotal > 0) {
          const withDetail: any[] = await this.prisma.$queryRawUnsafe(
            `SELECT wt.name, wt.type, wt.amount, wt.reason FROM finsync.payroll_withholdings wt
             WHERE wt.company_id = ${companyId}
               AND (wt.employee_id = ${e.id} OR wt."isGlobal" = true)
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
              `INSERT INTO finsync.payroll_item_deductions ("payroll_item_id", name, amount, type)
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
            `INSERT INTO finsync.payroll_item_deductions ("payroll_item_id", name, amount, type)
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

  /**
   * Update a DRAFT payroll run (currently: rename the title). Approved/paid
   * runs are immutable — their expense/ledger records reference the title.
   */
  async update(payrollId: number, dto: { title?: string }) {
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM finsync.payrolls WHERE id = ${payrollId}`,
    );
    if (!rows.length) throw new NotFoundException('Payroll not found');
    const p = rows[0];
    if (p.status !== 'DRAFT') {
      throw new BadRequestException(
        'Only DRAFT payrolls can be renamed — approved/paid runs are immutable.',
      );
    }
    const title = dto.title?.trim();
    if (title) {
      await this.prisma.$executeRawUnsafe(
        `UPDATE finsync.payrolls SET title = '${title.replace(/'/g, "''")}', "updated_at" = NOW() WHERE id = ${payrollId}`,
      );
    }
    return { updated: true, id: payrollId, title: title || p.title };
  }

  async approve(payrollId: number, registeredById?: number) {
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
      const expRows: { id: number }[] = await this.prisma.$queryRawUnsafe(
        `INSERT INTO finsync."CompanyExpense" (company_id, registered_by, amount, category, date, note, project_id, "createdAt", "isRecurring", "recurringFrequency")
         VALUES (${p.companyId}, ${registeredById ?? p.companyId}, ${amount}, 'Payroll', NOW(), 'Payroll: ${p.title}', ${p.projectId ?? 'NULL'}, NOW(), false, NULL)
         RETURNING id`,
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
  async markPaid(payrollId: number, registeredById?: number) {
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
      if (!p.expenseId) {
        const expRows: { id: number }[] = await this.prisma.$queryRawUnsafe(
          `INSERT INTO finsync."CompanyExpense" (company_id, registered_by, amount, category, date, note, project_id, "createdAt", "isRecurring", "recurringFrequency")
           VALUES (${p.companyId}, ${registeredById ?? p.companyId}, ${amount}, 'Payroll', NOW(), 'Payroll (PAID): ${p.title}', ${p.projectId ?? 'NULL'}, NOW(), false, NULL)
           RETURNING id`,
        );
        if (expRows.length) {
          await this.prisma.$executeRawUnsafe(
            `UPDATE finsync.payrolls SET "expenseId" = ${expRows[0].id} WHERE id = ${payrollId}`,
          );
        }
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
       LEFT JOIN finsync."CompanyExpense" ce ON ce.id = p."expenseId"
       LEFT JOIN finsync.journal_entries j ON j."sourceType" = 'PAYROLL' AND j."sourceId" = p.id
       WHERE p."companyId" = ${companyId} AND p.status <> 'VOIDED' ${pf}
       ORDER BY p."startDate" DESC, p.id DESC`,
    );
  }

  async getItems(payrollId: number) {
    const pRows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT "sourceType" FROM finsync.payrolls WHERE id = ${payrollId}`,
    );
    const isTW = pRows[0]?.sourceType === 'DAILY_LABORERS';
    if (isTW) {
      return this.prisma.$queryRawUnsafe(
        `SELECT pi.*, json_build_object('id', dl.id, 'firstName', dl."firstName", 'lastName', dl."lastName", 'employeeCode', dl."laborerCode") AS employee,
                'TEMPORARY_WORKER' AS "workerType"
         FROM finsync.payroll_items pi
         JOIN finsync.daily_laborers dl ON dl.id = pi."employeeId"
         WHERE pi."payrollId" = ${payrollId}`,
      );
    }
    return this.prisma.$queryRawUnsafe(
      `SELECT pi.*, json_build_object('id', e.id, 'firstName', e."firstName", 'lastName', e."lastName", 'employeeCode', e."employeeCode") AS employee
       FROM finsync.payroll_items pi
       JOIN finsync.employees e ON e.id = pi."employeeId"
       WHERE pi."payrollId" = ${payrollId}`,
    );
  }

  // ─── Payslip ──────────────────────────────────────────────

  async getPayslip(payrollId: number, itemId: number) {
    const pRows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT "sourceType" FROM finsync.payrolls WHERE id = ${payrollId}`,
    );
    const isTW = pRows[0]?.sourceType === 'DAILY_LABORERS';
    const itemRows: any[] = await this.prisma.$queryRawUnsafe(
      isTW
        ? `SELECT pi.*, json_build_object(
             'id', dl.id, 'firstName', dl."firstName", 'lastName', dl."lastName",
             'employeeCode', dl."laborerCode", 'designation', 'Temporary Worker'
           ) AS employee
           FROM finsync.payroll_items pi
           JOIN finsync.daily_laborers dl ON dl.id = pi."employeeId"
           WHERE pi.id = ${itemId} AND pi."payrollId" = ${payrollId}`
        : `SELECT pi.*, json_build_object(
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
      `SELECT * FROM finsync.payroll_item_deductions WHERE "payroll_item_id" = ${itemId}`,
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

  /**
   * Delete a DRAFT payroll run (with its items). Approved/paid runs are
   * immutable — they already created expense/ledger records. Also unlinks any
   * overtime/allowance/bonus/withholding records that pointed at the items.
   */
  async remove(payrollId: number) {
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM finsync.payrolls WHERE id = ${payrollId}`,
    );
    if (!rows.length) throw new NotFoundException('Payroll not found');
    const p = rows[0];
    if (p.status !== 'DRAFT') {
      throw new BadRequestException(
        'Only DRAFT payrolls can be deleted — approved/paid runs are immutable.',
      );
    }

    const itemIds =
      `SELECT id FROM finsync.payroll_items WHERE "payrollId" = ${payrollId}`;

    // Unlink linked compensation records before deleting the items
    await this.prisma.$executeRawUnsafe(
      `UPDATE finsync.overtime_entries SET "payrollItemId" = NULL
       WHERE "payrollItemId" IN (${itemIds})`,
    );
    await this.prisma.$executeRawUnsafe(
      `UPDATE finsync.employee_specific_allowances SET "payroll_item_id" = NULL
       WHERE "payroll_item_id" IN (${itemIds})`,
    );
    await this.prisma.$executeRawUnsafe(
      `UPDATE finsync.payroll_bonuses SET "payroll_item_id" = NULL
       WHERE "payroll_item_id" IN (${itemIds})`,
    );
    await this.prisma.$executeRawUnsafe(
      `UPDATE finsync.payroll_withholdings SET "payroll_item_id" = NULL
       WHERE "payroll_item_id" IN (${itemIds})`,
    );

    await this.prisma.$executeRawUnsafe(
      `DELETE FROM finsync.payroll_item_deductions WHERE "payroll_item_id" IN (${itemIds})`,
    );
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM finsync.payroll_items WHERE "payrollId" = ${payrollId}`,
    );
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM finsync.journal_lines
       WHERE entry_id IN (
         SELECT id FROM finsync.journal_entries
         WHERE "sourceType" = 'PAYROLL' AND "sourceId" = ${payrollId})`,
    );
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM finsync.journal_entries
       WHERE "sourceType" = 'PAYROLL' AND "sourceId" = ${payrollId}`,
    );
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM finsync.payrolls WHERE id = ${payrollId}`,
    );
    return { deleted: true, id: payrollId };
  }
}
