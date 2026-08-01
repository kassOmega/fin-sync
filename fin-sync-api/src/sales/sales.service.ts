import { Injectable, NotFoundException } from '@nestjs/common';
import { LedgerService } from '../ledger/ledger.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';

@Injectable()
export class SalesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private ledger: LedgerService,
  ) {}

  async create(companyId: number, dto: CreateSaleDto, registeredById: number) {
    const result = await this.prisma.$transaction(async (prisma) => {
      const sale = await prisma.sale.create({
        data: {
          companyId,
          customerId: dto.customerId,
          registeredBy: registeredById,
          totalAmount: dto.amount,
          discount: dto.discount || 0,
          note: dto.note,
        },
      });

      // Create sale items and decrement stock
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
              sellingPrice: item.unitPrice,
              costPrice: item.buyingPrice || 0,
              unit: item.unit || 'pcs',
            },
          });
          itemId = newItem.id;
        } else {
          itemId = item.itemId;
        }

        await prisma.saleItem.create({
          data: {
            saleId: sale.id,
            itemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          },
        });

        await prisma.storeItem.update({
          where: { id: itemId },
          data: { quantity: { decrement: item.quantity } },
        });
      }

      // Notify about large sale
      if (dto.amount > 500) {
        await this.notifications.notifyCompany(
          companyId,
          '🛒 Large Sale Recorded',
          `A sale of $${dto.amount.toLocaleString()} was recorded.`,
          registeredById,
        );
      }

      const fullSale = await prisma.sale.findUnique({
        where: { id: sale.id },
        include: {
          customer: true,
          user: { select: { id: true, name: true } },
          items: { include: { storeItem: true } },
        },
      });

      return { sale: fullSale };
    });

    // Auto-create journal entry outside the transaction: Debit Cash, Credit Sales Revenue
    if (result.sale) {
      try {
        await this.ledger.createAutoEntry(
          companyId,
          {
            sourceType: 'SALE',
            sourceId: result.sale.id,
            description: `Sale #${result.sale.id} - ${dto.note || 'Customer purchase'}`,
            date: result.sale.date,
            lines: [
              {
                accountCode: '1001',
                description: 'Cash/Bank received',
                debit: dto.amount,
                credit: 0,
              },
              {
                accountCode: '4001',
                description: 'Sales Revenue',
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

    return result.sale;
  }

  async findAll(companyId: number) {
    return this.prisma.sale.findMany({
      where: { companyId },
      include: {
        customer: true,
        user: { select: { id: true, name: true } },
        items: { include: { storeItem: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: number) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        customer: true,
        user: { select: { id: true, name: true } },
        items: { include: { storeItem: true } },
      },
    });
    if (!sale) throw new NotFoundException('Sale not found');
    return sale;
  }

  async getCustomers(companyId: number) {
    return this.prisma.customer.findMany({
      where: { companyId },
      include: { _count: { select: { sales: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCustomer(
    companyId: number,
    dto: { name: string; phone?: string; email?: string; address?: string },
  ) {
    return this.prisma.customer.create({
      data: { ...dto, companyId },
    });
  }
}
