import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StoreTxType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoreItemDto } from './dto/create-store-item.dto';
import { StoreTransactionDto } from './dto/store-transaction.dto';
import { UpdateStoreItemDto } from './dto/update-store-item.dto';

@Injectable()
export class StoreItemsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(companyId: number, dto: CreateStoreItemDto) {
    const item = await this.prisma.storeItem.create({
      data: {
        ...dto,
        companyId,
        quantity: dto.quantity || 0,
        lowStockThreshold: dto.lowStockThreshold || 5,
      },
    });

    await this.notifications.notifyCompany(
      companyId,
      '📦 New Store Item',
      `"${dto.name}" has been added to inventory.`,
    );

    return item;
  }

  async findAll(companyId: number) {
    return this.prisma.storeItem.findMany({ where: { companyId } });
  }

  async update(id: number, dto: UpdateStoreItemDto) {
    const item = await this.prisma.storeItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Item not found');
    return this.prisma.storeItem.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    const item = await this.prisma.storeItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Item not found');
    return this.prisma.storeItem.delete({ where: { id } });
  }

  async handleTransaction(
    itemId: number,
    dto: StoreTransactionDto,
    companyId: number,
  ) {
    const item = await this.prisma.storeItem.findFirst({
      where: { id: itemId, companyId },
    });
    if (!item) throw new NotFoundException('Item not found in this company');

    return this.prisma.$transaction(async (prisma) => {
      await prisma.storeTransaction.create({
        data: {
          itemId,
          companyId,
          type: dto.type,
          quantity: dto.quantity,
          issuedToUserId: dto.issuedToUserId,
        },
      });

      let newQuantity = item.quantity;
      if (dto.type === StoreTxType.ISSUE) {
        newQuantity -= dto.quantity;
        if (newQuantity < 0)
          throw new BadRequestException('Insufficient stock');
      } else if (
        dto.type === StoreTxType.RESTOCK ||
        dto.type === StoreTxType.RETURN
      ) {
        newQuantity += dto.quantity;
      }

      const updated = await prisma.storeItem.update({
        where: { id: itemId },
        data: { quantity: newQuantity },
      });

      // Check low stock after transaction
      if (
        updated.quantity <= updated.lowStockThreshold &&
        updated.quantity > 0
      ) {
        await this.notifications.notifyCompany(
          companyId,
          '📦 Low Stock Alert',
          `"${updated.name}" is running low: ${updated.quantity} remaining (threshold: ${updated.lowStockThreshold}).`,
        );
      } else if (updated.quantity <= 0) {
        await this.notifications.notifyCompany(
          companyId,
          '🚨 Out of Stock',
          `"${updated.name}" is out of stock!`,
        );
      }

      return updated;
    });
  }
}
