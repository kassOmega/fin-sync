import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PermissionCode } from '../common/constants/permission-codes';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permission.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { PurchasesService } from './purchases.service';

@Controller('companies/:companyId/purchases')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PurchasesController {
  constructor(private readonly service: PurchasesService) {}

  @Post()
  @RequirePermissions(PermissionCode.PURCHASES_WRITE)
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
  @RequirePermissions(PermissionCode.PURCHASES_READ)
  findAll(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.service.findAll(companyId);
  }

  @Patch(':id')
  @RequirePermissions(PermissionCode.PURCHASES_WRITE)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { amount?: number; note?: string; supplierId?: number },
    @CurrentUser() user: any,
  ) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @RequirePermissions(PermissionCode.PURCHASES_WRITE)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  @Get('suppliers/list')
  @RequirePermissions(PermissionCode.SUPPLIER_MANAGE)
  getSuppliers(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.service.getSuppliers(companyId);
  }

  @Post('suppliers')
  @RequirePermissions(PermissionCode.SUPPLIER_MANAGE)
  createSupplier(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body()
    dto: { name: string; phone?: string; email?: string; address?: string },
  ) {
    return this.service.createSupplier(companyId, dto);
  }
}
