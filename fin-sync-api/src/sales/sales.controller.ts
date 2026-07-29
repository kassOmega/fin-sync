import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PermissionCode } from '../common/constants/permission-codes';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permission.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SalesService } from './sales.service';

@Controller('companies/:companyId/sales')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SalesController {
  constructor(private readonly service: SalesService) {}

  @Post()
  @RequirePermissions(PermissionCode.SALES_WRITE)
  create(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body() dto: CreateSaleDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.service.create(companyId, dto, userId);
  }

  @Get()
  @RequirePermissions(PermissionCode.SALES_READ)
  findAll(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.service.findAll(companyId);
  }

  @Get('customers/list')
  @RequirePermissions(PermissionCode.CUSTOMER_MANAGE)
  getCustomers(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.service.getCustomers(companyId);
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.SALES_READ)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post('customers')
  @RequirePermissions(PermissionCode.CUSTOMER_MANAGE)
  createCustomer(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body()
    dto: { name: string; phone?: string; email?: string; address?: string },
  ) {
    return this.service.createCustomer(companyId, dto);
  }
}
