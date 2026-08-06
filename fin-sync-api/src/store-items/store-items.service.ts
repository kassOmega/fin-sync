import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StoreTxType } from '@prisma/client';
import { LedgerService } from '../ledger/ledger.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { StoresService } from '../stores/stores.service';
import { CreateStoreItemDto } from './dto/create-store-item.dto';
import { StoreTransactionDto } from './dto/store-transaction.dto';
import { UpdateStoreItemDto } from './dto/update-store-item.dto';

@Injectable()
export class StoreItemsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private ledger: LedgerService,
    private storesService: StoresService,
  ) {}

  async create(companyId: number, dto: CreateStoreItemDto) {
    const storeId = dto.storeId;
    if (!storeId) throw new BadRequestException('storeId is required');

    // Verify store belongs to company
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, companyId },
    });
    if (!store) throw new NotFoundException('Store not found in this company');

    const item = await this.prisma.storeItem.create({
      data: {
        name: dto.name,
        categoryId: dto.categoryId,
        companyId,
        storeId,
        quantity: dto.quantity || 0,
        lowStockThreshold: dto.lowStockThreshold || 5,
        costPrice: dto.costPrice || 0,
        sellingPrice: dto.sellingPrice || 0,
        unit: dto.unit || 'pcs',
      },
    });

    await this.notifications.notifyCompany(
      companyId,
      '📦 New Store Item',
      `"${dto.name}" has been added to inventory.`,
    );

    return item;
  }

  async findAll(companyId: number, storeId?: number, categoryId?: number) {
    const where: any = { companyId };
    if (storeId) where.storeId = storeId;
    if (categoryId) where.categoryId = categoryId;

    return this.prisma.storeItem.findMany({
      where,
      include: { category: true, store: { select: { id: true, name: true } } },
    });
  }

  /** Find items belonging to specific stores (for project-scoped views) */
  async findByStoreIds(storeIds: number[]) {
    if (storeIds.length === 0) return [];
    return this.prisma.storeItem.findMany({
      where: { storeId: { in: storeIds } },
      include: { category: true, store: { select: { id: true, name: true } } },
    });
  }

  async getCategories(companyId: number) {
    return this.prisma.storeCategory.findMany({
      where: { companyId },
      include: { _count: { select: { items: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(companyId: number, name: string) {
    return this.prisma.storeCategory.create({
      data: { name, companyId },
    });
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

  // 5. Storekeeper marks issued tool as returned (restores stock)
  async returnItem(requestId: number, user: any, companyId: number) {
    const request = await this.prisma.storeRequest.findUnique({
      where: { id: requestId },
      include: { item: { select: { storeId: true } } },
    });
    if (!request) throw new NotFoundException('Request not found');
    if (request.status !== 'ISSUED')
      throw new BadRequestException('Only issued items can be returned');

    // Check storekeeper per store
    if (request.item?.storeId) {
      await this.storesService.assertStorekeeper(
        request.item.storeId,
        user.id,
        user.role,
      );
    } else if (user.role !== 'Storekeeper' && user.role !== 'Owner') {
      throw new BadRequestException('Only storekeepers can return items');
    }

    // Only tools can be returned — consumables stay issued
    const item = await this.prisma.storeItem.findUnique({
      where: { id: request.itemId },
      select: { isTool: true },
    });
    if (!item?.isTool) {
      throw new BadRequestException(
        'Only tools can be returned. Consumables are permanently issued.',
      );
    }

    return this.prisma.$transaction(async (prisma) => {
      // Fetch full item for cost data
      const fullItem = await prisma.storeItem.findUnique({
        where: { id: request.itemId },
      });
      if (!fullItem) throw new NotFoundException('Item not found');

      // Restore stock
      await prisma.storeItem.update({
        where: { id: request.itemId },
        data: { quantity: { increment: request.quantity } },
      });

      // Log the return transaction with ledger linkage
      const tx = await prisma.storeTransaction.create({
        data: {
          itemId: request.itemId,
          companyId,
          storeId: fullItem.storeId,
          type: 'RETURN',
          quantity: request.quantity,
          issuedToUserId: request.userId,
          issuedById: user.id,
          unitCost: fullItem.costPrice || 0,
          totalCost: (fullItem.costPrice || 0) * request.quantity,
          note: `Returned from request #${request.id}`,
        },
      });

      // Mark request as returned
      const updated = await prisma.storeRequest.update({
        where: { id: requestId },
        data: { status: 'RETURNED' },
      });

      // Post reversal journal entry: Debit Inventory, Credit Equipment
      const totalCost = (fullItem.costPrice || 0) * request.quantity;
      if (totalCost > 0) {
        try {
          const entry = await this.ledger.createAutoEntry(
            companyId,
            {
              sourceType: 'STORE_RETURN',
              sourceId: requestId,
              description: `Store return: ${fullItem.name} (${request.quantity} ${fullItem.unit})`,
              date: new Date(),
              projectId: request.projectId ?? undefined,
              lines: [
                {
                  accountCode: '1201',
                  description: 'Inventory - Raw Materials',
                  debit: totalCost,
                  credit: 0,
                },
                {
                  accountCode: '1510',
                  description: 'Machinery & Equipment',
                  debit: 0,
                  credit: totalCost,
                },
              ],
            },
            user.id,
          );

          if (entry?.id) {
            await prisma.storeTransaction.update({
              where: { id: tx.id },
              data: { ledgerEntryId: entry.id },
            });
          }
        } catch {
          // Journal should not block the return
        }
      }

      return updated;
    });
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
      const tx = await prisma.storeTransaction.create({
        data: {
          itemId,
          companyId,
          storeId: item.storeId,
          type: dto.type,
          quantity: dto.quantity,
          issuedToUserId: dto.issuedToUserId,
          issuedById: dto.issuedById,
          unitCost: item.costPrice || 0,
          totalCost: (item.costPrice || 0) * dto.quantity,
          projectId: dto.projectId,
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

      // Post journal entry for ISSUE/RESTOCK/RETURN
      const totalCost = (item.costPrice || 0) * dto.quantity;
      if (totalCost > 0) {
        try {
          let debitCode = '5001'; // COGS for ISSUE
          let creditCode = '1201';
          if (dto.type === StoreTxType.RESTOCK) {
            debitCode = '1201'; // Inventory in
            creditCode = '1001'; // Cash out
          } else if (dto.type === StoreTxType.RETURN) {
            debitCode = '1201'; // Inventory back
            creditCode = '1510'; // Equipment out
          }

          const entry = await this.ledger.createAutoEntry(
            companyId,
            {
              sourceType: `STORE_${dto.type}`,
              sourceId: itemId,
              description: `Store ${dto.type.toLowerCase()}: ${item.name} (${dto.quantity} ${item.unit})`,
              date: new Date(),
              projectId: dto.projectId,
              lines: [
                {
                  accountCode: debitCode,
                  description: item.name,
                  debit: totalCost,
                  credit: 0,
                },
                {
                  accountCode: creditCode,
                  description: item.name,
                  debit: 0,
                  credit: totalCost,
                },
              ],
            },
            dto.issuedById,
          );

          if (entry?.id) {
            await prisma.storeTransaction.update({
              where: { id: tx.id },
              data: { ledgerEntryId: entry.id },
            });
          }
        } catch {
          // Journal should not block the stock transaction
        }
      }

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
