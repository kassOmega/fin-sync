import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateNotificationDto) {
    return this.prisma.notification.create({ data: dto });
  }

  // Convenience method to create a notification for a user
  async notifyUser(userId: number, title: string, message: string) {
    return this.prisma.notification.create({
      data: { userId, title, message },
    });
  }

  // Notify all members of a company
  async notifyCompany(
    companyId: number,
    title: string,
    message: string,
    excludeUserId?: number,
  ) {
    const members = await this.prisma.companyMember.findMany({
      where: { companyId },
      select: { userId: true },
    });

    // Also notify the company owner
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { ownerId: true },
    });

    const userIds = new Set(members.map((m) => m.userId));
    if (company) userIds.add(company.ownerId);
    if (excludeUserId) userIds.delete(excludeUserId);

    const data = Array.from(userIds).map((userId) => ({
      userId,
      title,
      message,
    }));

    if (data.length > 0) {
      await this.prisma.notification.createMany({ data });
    }
  }

  async findAll(userId: number) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getUnreadCount(userId: number) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(id: number) {
    const notif = await this.prisma.notification.findUnique({ where: { id } });
    if (!notif) throw new NotFoundException('Notification not found');
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: number) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
