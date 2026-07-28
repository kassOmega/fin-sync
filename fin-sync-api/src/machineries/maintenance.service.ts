import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MaintenanceService {
  constructor(private prisma: PrismaService) {}

  // Operator logs hours worked — scoped to assigned operators only
  async logHours(machineryId: number, hours: number, userId: number) {
    const machine = await this.prisma.machinery.findUnique({
      where: { id: machineryId },
      include: {
        operators: { select: { userId: true, isHelper: true } },
      },
    });
    if (!machine) throw new NotFoundException('Machinery not found');

    // Verify: only assigned operators (or owner) can log hours
    const isAssigned = machine.operators.some((op) => op.userId === userId);
    if (!isAssigned) {
      // Allow owners through — they manage everything
      const company = await this.prisma.company.findUnique({
        where: { id: machine.companyId },
        select: { ownerId: true },
      });
      if (company?.ownerId !== userId) {
        throw new ForbiddenException('You are not assigned to this machine');
      }
    }

    const newRunningHours = machine.runningHours + hours;

    // Check if maintenance is due (every 250 hours)
    let maintenanceDue = false;
    if (newRunningHours - machine.lastMaintenanceHours >= 250) {
      maintenanceDue = true;

      // Create a notification for the owner
      const owner = await this.prisma.company.findUnique({
        where: { id: machine.companyId },
        select: { ownerId: true },
      });

      if (owner) {
        await this.prisma.notification.create({
          data: {
            userId: owner.ownerId,
            title: '🔧 Maintenance Due',
            message: `${machine.name} has reached ${newRunningHours} hours and requires maintenance.`,
            isRead: false,
          },
        });
      }

      // Auto-set status to MAINTENANCE
      await this.prisma.machinery.update({
        where: { id: machineryId },
        data: { status: 'MAINTENANCE' },
      });
    }

    const updatedMachine = await this.prisma.machinery.update({
      where: { id: machineryId },
      data: { runningHours: newRunningHours },
    });

    return { machine: updatedMachine, maintenanceDue };
  }

  // Owner/Storekeeper completes maintenance
  async completeMaintenance(machineryId: number) {
    const machine = await this.prisma.machinery.findUnique({
      where: { id: machineryId },
    });
    if (!machine) throw new NotFoundException('Machinery not found');

    return this.prisma.machinery.update({
      where: { id: machineryId },
      data: {
        lastMaintenanceHours: machine.runningHours,
        status: 'IDLE',
      },
    });
  }
}
