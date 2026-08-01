import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MaintenanceService {
  constructor(private prisma: PrismaService) {}

  async logHours(machineryId: number, hours: number, userId: number) {
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM finsync.machineries WHERE id = ${machineryId}`,
    );
    if (!rows.length) throw new NotFoundException('Machinery not found');
    const machine = rows[0];

    // Verify operator assignment
    if (machine.operatorId) {
      const empRows: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT "userId" FROM finsync.employees WHERE id = ${machine.operatorId}`,
      );
      if (!empRows.length || empRows[0].userId !== userId) {
        const companyRows: any[] = await this.prisma.$queryRawUnsafe(
          `SELECT owner_id FROM finsync."Company" WHERE id = ${machine.companyId}`,
        );
        if (!companyRows.length || companyRows[0].owner_id !== userId) {
          throw new ForbiddenException('You are not assigned to this machine');
        }
      }
    }

    const currentHours = parseFloat(machine.totalHoursRun || 0);
    const newHours = currentHours + hours;

    // Maintenance check at 250 hours
    let maintenanceDue = false;
    if (
      newHours >= 250 &&
      Math.floor(currentHours / 250) < Math.floor(newHours / 250)
    ) {
      maintenanceDue = true;
      await this.prisma.$executeRawUnsafe(
        `UPDATE finsync.machineries SET status = 'UNDER_MAINTENANCE' WHERE id = ${machineryId}`,
      );
    }

    await this.prisma.$executeRawUnsafe(
      `UPDATE finsync.machineries SET "totalHoursRun" = ${newHours}, "updated_at" = NOW() WHERE id = ${machineryId}`,
    );

    // Create machinery log
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO finsync.machinery_logs ("machineryId", "hoursLogged", "operatorId", date, created_at)
       VALUES (${machineryId}, ${hours}, ${machine.operatorId ?? 'NULL'}, NOW(), NOW())`,
    );

    return { machineId: machineryId, hours, maintenanceDue };
  }

  async completeMaintenance(machineryId: number) {
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM finsync.machineries WHERE id = ${machineryId}`,
    );
    if (!rows.length) throw new NotFoundException('Machinery not found');

    await this.prisma.$executeRawUnsafe(
      `UPDATE finsync.machineries SET status = 'AVAILABLE', "updated_at" = NOW() WHERE id = ${machineryId}`,
    );

    // Create maintenance record
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO finsync.machinery_maintenances (machinery_id, description, total_cost, "createdAt")
       VALUES (${machineryId}, 'Maintenance completed', 0, NOW())`,
    );

    return { machineryId, status: 'AVAILABLE' };
  }
}
