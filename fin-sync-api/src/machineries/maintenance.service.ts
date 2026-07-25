import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MaintenanceService {
  constructor(private prisma: PrismaService) {}

  // Operator logs hours worked
  async logHours(machineryId: number, hours: number) {
    const machine = await this.prisma.machinery.findUnique({
      where: { id: machineryId },
    });
    if (!machine) throw new NotFoundException('Machinery not found');

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
            title: 'Maintenance Due',
            message: `${machine.name} has reached ${newRunningHours} hours and requires maintenance.`,
            isRead: false,
          },
        });
      }
    }

    const updatedMachine = await this.prisma.machinery.update({
      where: { id: machineryId },
      data: { runningHours: newRunningHours },
    });

    return { machine: updatedMachine, maintenanceDue };
  }

  // Storekeeper/Owner completes maintenance
  async completeMaintenance(machineryId: number) {
    const machine = await this.prisma.machinery.findUnique({
      where: { id: machineryId },
    });
    if (!machine) throw new NotFoundException('Machinery not found');

    return this.prisma.machinery.update({
      where: { id: machineryId },
      data: {
        lastMaintenanceHours: machine.runningHours,
        status: 'IDLE', // Reset to idle after maintenance
      },
    });
  }
}
