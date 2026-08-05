import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkPositionsService {
  constructor(private prisma: PrismaService) {}

  // ─── Positions ─────────────────────────────────────────────

  async createPosition(
    companyId: number,
    name: string,
    allowances?: Array<{
      name: string;
      amount: number;
      isTaxable?: boolean;
      effectiveFrom: string;
      effectiveTo?: string;
    }>,
  ) {
    const rows: { id: number }[] = await this.prisma.$queryRawUnsafe(
      `INSERT INTO finsync.work_positions ("company_id", name, "isActive", "created_at", "updated_at")
       VALUES (${companyId}, '${name.replace(/'/g, "''")}', true, NOW(), NOW())
       RETURNING id`,
    );
    const positionId = rows[0].id;

    // Create multiple allowance options for the position in one go
    if (allowances?.length) {
      for (const a of allowances) {
        if (!a.name?.trim() || !a.amount || a.amount <= 0) continue;
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO finsync.position_allowances
             ("company_id", "position_id", name, amount, "isTaxable", "effectiveFrom", "effectiveTo", "isActive", "taxConfig", "created_at", "updated_at")
           VALUES (${companyId}, ${positionId}, '${a.name.replace(/'/g, "''")}',
             ${a.amount}, ${a.isTaxable ?? true}, '${a.effectiveFrom}',
             ${a.effectiveTo ? `'${a.effectiveTo}'` : 'NULL'},
             true, NULL, NOW(), NOW())`,
        );
      }
    }

    return this.findOnePosition(companyId, positionId);
  }

  async findAllPositions(companyId: number) {
    return this.prisma.$queryRawUnsafe(
      `SELECT wp.*,
         COUNT(DISTINCT e.id) AS "employeeCount",
         COUNT(DISTINCT pa.id) AS "allowanceCount"
       FROM finsync.work_positions wp
       LEFT JOIN finsync.employees e ON e."position_id" = wp.id
       LEFT JOIN finsync.position_allowances pa ON pa."position_id" = wp.id
       WHERE wp."company_id" = ${companyId}
       GROUP BY wp.id
       ORDER BY wp.name`,
    );
  }

  // Returns positions with nested allowances (avoids N+1)
  async findAllPositionsWithAllowances(companyId: number) {
    const positions = await (this.prisma as any).workPosition.findMany({
      where: { companyId },
      include: { allowances: true },
      orderBy: { name: 'asc' },
    });
    return positions;
  }

  async findOnePosition(companyId: number, id: number) {
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM finsync.work_positions WHERE id = ${id} AND "company_id" = ${companyId}`,
    );
    if (!rows.length) throw new NotFoundException('Work position not found');
    return rows[0];
  }

  async updatePosition(
    companyId: number,
    id: number,
    dto: { name?: string; isActive?: boolean },
  ) {
    const sets: string[] = ['"updated_at" = NOW()'];
    if (dto.name) sets.push(`name = '${dto.name.replace(/'/g, "''")}'`);
    if (dto.isActive !== undefined) sets.push(`"isActive" = ${dto.isActive}`);
    await this.prisma.$executeRawUnsafe(
      `UPDATE finsync.work_positions SET ${sets.join(', ')} WHERE id = ${id} AND "company_id" = ${companyId}`,
    );
    return this.findOnePosition(companyId, id);
  }

  async deletePosition(companyId: number, id: number) {
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM finsync.work_positions WHERE id = ${id} AND "company_id" = ${companyId}`,
    );
    return { id, deleted: true };
  }

  // ─── Position Allowances ───────────────────────────────────

  async createAllowance(
    companyId: number,
    dto: {
      positionId: number;
      name: string;
      amount: number;
      isTaxable?: boolean;
      effectiveFrom: string;
      effectiveTo?: string;
      taxConfig?: Record<string, unknown> | null;
    },
  ) {
    const rows: { id: number }[] = await this.prisma.$queryRawUnsafe(
      `INSERT INTO finsync.position_allowances
         ("company_id", "position_id", name, amount, "isTaxable", "effectiveFrom", "effectiveTo", "isActive", "taxConfig", "created_at", "updated_at")
       VALUES (${companyId}, ${dto.positionId}, '${dto.name.replace(/'/g, "''")}',
         ${dto.amount}, ${dto.isTaxable ?? true}, '${dto.effectiveFrom}',
         ${dto.effectiveTo ? `'${dto.effectiveTo}'` : 'NULL'},
         true,
         ${dto.taxConfig ? `'${JSON.stringify(dto.taxConfig).replace(/'/g, "''")}'` : 'NULL'},
         NOW(), NOW())
       RETURNING id`,
    );
    const row: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM finsync.position_allowances WHERE id = ${rows[0].id}`,
    );
    return row[0];
  }

  async findAllowancesByPosition(companyId: number, positionId: number) {
    return this.prisma.$queryRawUnsafe(
      `SELECT * FROM finsync.position_allowances
       WHERE "company_id" = ${companyId} AND "position_id" = ${positionId}
       ORDER BY "effectiveFrom" DESC`,
    );
  }

  async findAllAllowances(
    companyId: number,
    filters?: { positionId?: number; isActive?: boolean },
  ) {
    const conditions: string[] = [`pa."company_id" = ${companyId}`];
    if (filters?.positionId)
      conditions.push(`pa."position_id" = ${filters.positionId}`);
    if (filters?.isActive !== undefined)
      conditions.push(`pa."isActive" = ${filters.isActive}`);
    return this.prisma.$queryRawUnsafe(
      `SELECT pa.*, wp.name AS "positionName", wp."isActive" AS "positionIsActive"
       FROM finsync.position_allowances pa
       JOIN finsync.work_positions wp ON wp.id = pa."position_id"
       WHERE ${conditions.join(' AND ')}
       ORDER BY wp.name, pa.name`,
    );
  }

  async updateAllowance(
    companyId: number,
    id: number,
    dto: Partial<{
      name: string;
      amount: number;
      isTaxable: boolean;
      positionId: number;
      effectiveFrom: string;
      effectiveTo: string | null;
      isActive: boolean;
      taxConfig: Record<string, unknown> | null;
    }>,
  ) {
    const sets: string[] = ['"updated_at" = NOW()'];
    if (dto.name !== undefined)
      sets.push(`name = '${dto.name.replace(/'/g, "''")}'`);
    if (dto.amount !== undefined) sets.push(`amount = ${dto.amount}`);
    if (dto.isTaxable !== undefined)
      sets.push(`"isTaxable" = ${dto.isTaxable}`);
    if (dto.positionId !== undefined)
      sets.push(`"position_id" = ${dto.positionId}`);
    if (dto.effectiveFrom !== undefined)
      sets.push(`"effectiveFrom" = '${dto.effectiveFrom}'`);
    if (dto.effectiveTo !== undefined)
      sets.push(
        `"effectiveTo" = ${dto.effectiveTo ? `'${dto.effectiveTo}'` : 'NULL'}`,
      );
    if (dto.isActive !== undefined) sets.push(`"isActive" = ${dto.isActive}`);
    if (dto.taxConfig !== undefined)
      sets.push(
        `"taxConfig" = ${dto.taxConfig ? `'${JSON.stringify(dto.taxConfig).replace(/'/g, "''")}'` : 'NULL'}`,
      );

    await this.prisma.$executeRawUnsafe(
      `UPDATE finsync.position_allowances SET ${sets.join(', ')} WHERE id = ${id} AND "company_id" = ${companyId}`,
    );
    const row: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM finsync.position_allowances WHERE id = ${id}`,
    );
    return row[0];
  }

  async deleteAllowance(companyId: number, id: number) {
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM finsync.position_allowances WHERE id = ${id} AND "company_id" = ${companyId}`,
    );
    return { id, deleted: true };
  }
}
