import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SystemRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { PurchasesService } from './purchases.service';

@Controller('companies/:companyId/purchases')
@UseGuards(RolesGuard)
@Roles(SystemRole.Owner, SystemRole.Storekeeper)
export class PurchasesController {
  constructor(private readonly service: PurchasesService) {}

  @Post()
  create(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body()
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
    @CurrentUser('id') userId: number,
  ) {
    return this.service.create(companyId, dto, userId);
  }

  @Get()
  findAll(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.service.findAll(companyId);
  }

  @Get('suppliers/list')
  getSuppliers(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.service.getSuppliers(companyId);
  }

  @Post('suppliers')
  createSupplier(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body()
    dto: { name: string; phone?: string; email?: string; address?: string },
  ) {
    return this.service.createSupplier(companyId, dto);
  }
}
