import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMachineryDto } from './dto/create-machinery.dto';
import { UpdateMachineryDto } from './dto/update-machinery.dto';

@Injectable()
export class MachineriesService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: number, dto: CreateMachineryDto) {
    // Decimal DTO values arrive as strings; coerce to numbers for raw SQL
    const num = (v?: string | number | null) =>
      v === '' || v === null || v === undefined ? 'NULL' : Number(v);
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO finsync.machineries ("companyId", name, code, type, status, make, model, "plateNumber", "serialNumber", "currentMileage", "hourlyRate", "dailyRate", "projectId", "purchaseDate", "purchaseCost", "residualValue", "usefulLifeYears", "created_at", "updated_at")
       VALUES (${companyId}, '${dto.name}', ${dto.code ? `'${dto.code}'` : 'NULL'}, '${dto.type || 'OTHER'}', '${dto.status || 'AVAILABLE'}',
               ${dto.make ? `'${dto.make}'` : 'NULL'}, ${dto.model ? `'${dto.model}'` : 'NULL'},
               ${dto.plateNumber ? `'${dto.plateNumber}'` : 'NULL'}, ${dto.serialNumber ? `'${dto.serialNumber}'` : 'NULL'},
               ${num(dto.currentMileage)}, ${num(dto.hourlyRate)}, ${num(dto.dailyRate)},
               ${dto.projectId ?? 'NULL'}, ${dto.purchaseDate ? `'${dto.purchaseDate}'` : 'NULL'},
               ${num(dto.purchaseCost)}, ${num(dto.residualValue)},
               ${dto.usefulLifeYears ?? 'NULL'},
               NOW(), NOW())`,
    );
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM finsync.machineries ORDER BY id DESC LIMIT 1`,
    );
    return rows[0];
  }

  async findAll(companyId: number) {
    return this.prisma.$queryRawUnsafe(
      `SELECT m.* FROM finsync.machineries m WHERE m."companyId" = ${companyId} ORDER BY m.name`,
    );
  }

  async findByProject(projectId: number) {
    return this.prisma.$queryRawUnsafe(
      `SELECT m.* FROM finsync.machineries m WHERE m."projectId" = ${projectId} ORDER BY m.name`,
    );
  }

  async findMyMachines(companyId: number, userId: number) {
    return this.prisma.$queryRawUnsafe(
      `SELECT m.* FROM finsync.machineries m
       WHERE m."companyId" = ${companyId} AND m."operatorId" IN (
         SELECT id FROM finsync.employees WHERE "userId" = ${userId}
       )
       ORDER BY m.name`,
    );
  }

  async update(id: number, dto: UpdateMachineryDto) {
    const sets: string[] = ['"updated_at" = NOW()'];
    if (dto.name) sets.push(`name = '${dto.name}'`);
    if (dto.status) sets.push(`status = '${dto.status}'`);
    if (dto.type) sets.push(`type = '${dto.type}'`);
    if (dto.code !== undefined)
      sets.push(`code = ${dto.code ? `'${dto.code}'` : 'NULL'}`);
    if (dto.projectId !== undefined)
      sets.push(`"projectId" = ${dto.projectId ?? 'NULL'}`);
    if (dto.make) sets.push(`make = '${dto.make}'`);
    if (dto.model) sets.push(`model = '${dto.model}'`);
    if (dto.plateNumber !== undefined)
      sets.push(
        `"plateNumber" = ${dto.plateNumber ? `'${dto.plateNumber}'` : 'NULL'}`,
      );
    if (dto.serialNumber !== undefined)
      sets.push(
        `"serialNumber" = ${dto.serialNumber ? `'${dto.serialNumber}'` : 'NULL'}`,
      );

    await this.prisma.$executeRawUnsafe(
      `UPDATE finsync.machineries SET ${sets.join(', ')} WHERE id = ${id}`,
    );
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM finsync.machineries WHERE id = ${id}`,
    );
    if (!rows.length) throw new NotFoundException('Machinery not found');
    return rows[0];
  }

  async remove(id: number) {
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM finsync.machineries WHERE id = ${id}`,
    );
    return { id, deleted: true };
  }

  // ─── Machinery usage logs (equipment timesheet) ───

  async findLogs(
    companyId: number,
    filters?: { machineryId?: number; startDate?: string; endDate?: string },
  ) {
    let where = `m."companyId" = ${companyId}`;
    if (filters?.machineryId)
      where += ` AND ml."machineryId" = ${filters.machineryId}`;
    if (filters?.startDate) where += ` AND ml.date >= '${filters.startDate}'`;
    if (filters?.endDate) where += ` AND ml.date <= '${filters.endDate}'`;
    return this.prisma.$queryRawUnsafe(
      `SELECT ml.*, json_build_object('id', m.id, 'name', m.name, 'code', m.code, 'type', m.type) AS machinery,
              json_build_object('id', e.id, 'firstName', e."firstName", 'lastName', e."lastName") AS operator,
              json_build_object('id', p.id, 'name', p.name) AS project
       FROM finsync.machinery_logs ml
       JOIN finsync.machineries m ON m.id = ml."machineryId"
       LEFT JOIN finsync.employees e ON e.id = ml."operatorId"
       LEFT JOIN finsync."projects" p ON p.id = ml."projectId"
       WHERE ${where}
       ORDER BY ml.date DESC, ml.id DESC`,
    );
  }

  async logUsage(
    companyId: number,
    machineryId: number,
    dto: {
      hours?: number;
      fuelLiters?: number;
      fuelCost?: number;
      projectId?: number;
      operatorId?: number;
      note?: string;
    },
  ) {
    const machine: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM finsync.machineries WHERE id = ${machineryId} AND "companyId" = ${companyId}`,
    );
    if (!machine[0]) throw new NotFoundException('Machinery not found');
    const hours = dto.hours ?? 0;
    const currentHours = parseFloat(machine[0].totalHoursRun || 0);
    const newHours = currentHours + hours;
    await this.prisma.$executeRawUnsafe(
      `UPDATE finsync.machineries SET "totalHoursRun" = ${newHours}, "updated_at" = NOW() WHERE id = ${machineryId}`,
    );
    const inserted: { id: number }[] = await this.prisma.$queryRawUnsafe(
      `INSERT INTO finsync.machinery_logs ("machineryId", "projectId", "operatorId", "hoursLogged", "fuelLiters", "fuelCost", date, created_at)
       VALUES (${machineryId}, ${dto.projectId ?? 'NULL'}, ${dto.operatorId ?? 'NULL'}, ${hours},
               ${dto.fuelLiters ?? 'NULL'}, ${dto.fuelCost ?? 'NULL'}, NOW(), NOW())
       RETURNING id`,
    );
    return { id: inserted[0].id, machineryId, hours, totalHoursRun: newHours };
  }

  async assignOperator(machineryId: number, userId: number) {
    const empRows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT id FROM finsync.employees WHERE "userId" = ${userId} LIMIT 1`,
    );
    if (!empRows.length)
      throw new NotFoundException('Employee record not found for this user');
    await this.prisma.$executeRawUnsafe(
      `UPDATE finsync.machineries SET "operatorId" = ${empRows[0].id} WHERE id = ${machineryId}`,
    );
    return { machineryId, operatorId: empRows[0].id };
  }

  async unassignOperator(machineryId: number) {
    await this.prisma.$executeRawUnsafe(
      `UPDATE finsync.machineries SET "operatorId" = NULL WHERE id = ${machineryId}`,
    );
    return { machineryId, operatorId: null };
  }
}
