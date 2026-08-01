import { Injectable } from '@nestjs/common';
import { LedgerService } from '../ledger/ledger.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PurchasesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private ledger: LedgerService,
  ) {}

  async create(
    companyId: number,
    dto: {
      supplierId?: number;
      amount: number;
      note?: string;
      items: {
        itemId?: number;
        name?: string;
        categoryId?: number;
        sellingPrice?: number;
        unit?: string;
        quantity: number;
        unitCost: number;
      }[];
    },
    registeredById: number,
  ) {
    const result = await this.prisma.$transaction(async (prisma) => {
      const purchase = await prisma.purchase.create({
        data: {
          companyId,
          supplierId: dto.supplierId,
          registeredBy: registeredById,
          totalAmount: dto.amount,
          note: dto.note,
        },
      });

      for (const item of dto.items) {
        let itemId: number;

        // If no itemId, create a new store item first
        if (!item.itemId) {
          if (!item.name)
            throw new Error('Item name is required for new items');
          if (!item.categoryId)
            throw new Error('Category is required for new items');
          const newItem = await prisma.storeItem.create({
            data: {
              companyId,
              name: item.name,
              categoryId: item.categoryId,
              quantity: 0,
              costPrice: item.unitCost,
              sellingPrice: item.sellingPrice || item.unitCost * 1.2, // default 20% markup
              unit: item.unit || 'pcs',
            },
          });
          itemId = newItem.id;
        } else {
          itemId = item.itemId;
        }

        await prisma.purchaseItem.create({
          data: {
            purchaseId: purchase.id,
            itemId,
            quantity: item.quantity,
            unitCost: item.unitCost,
            total: item.quantity * item.unitCost,
          },
        });

        // Restock: increment quantity and update cost price
        await prisma.storeItem.update({
          where: { id: itemId },
          data: {
            quantity: { increment: item.quantity },
            costPrice: item.unitCost,
          },
        });
      }

      await this.notifications.notifyCompany(
        companyId,
        '📦 New Purchase',
        `Stock purchased for $${dto.amount.toLocaleString()}.`,
        registeredById,
      );

      const fullPurchase = await prisma.purchase.findUnique({
        where: { id: purchase.id },
        include: {
          supplier: true,
          user: { select: { id: true, name: true } },
          items: { include: { storeItem: true } },
        },
      });

      return { purchase: fullPurchase };
    });

    // Auto-create journal entry: Debit Inventory, Credit Cash/Payable
    if (result.purchase) {
      try {
        await this.ledger.createAutoEntry(
          companyId,
          {
            sourceType: 'PURCHASE',
            sourceId: result.purchase.id,
            description: `Purchase #${result.purchase.id} - ${dto.note || 'Inventory purchase'}`,
            date: result.purchase.date,
            lines: [
              {
                accountCode: '1201',
                description: 'Inventory received',
                debit: dto.amount,
                credit: 0,
              },
              {
                accountCode: '1001',
                description: 'Cash/Bank payment',
                debit: 0,
                credit: dto.amount,
              },
            ],
          },
          registeredById,
        );
      } catch {
        // Journal entry creation should not block the main transaction
      }
    }

    return result.purchase;
  }

  async findAll(companyId: number) {
    return this.prisma.purchase.findMany({
      where: { companyId },
      include: {
        supplier: true,
        user: { select: { id: true, name: true } },
        items: { include: { storeItem: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async getSuppliers(companyId: number) {
    return this.prisma.supplier.findMany({
      where: { companyId },
      include: { _count: { select: { purchases: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createSupplier(
    companyId: number,
    dto: { name: string; phone?: string; email?: string; address?: string },
  ) {
    return this.prisma.supplier.create({
      data: { ...dto, companyId },
    });
  }
}
