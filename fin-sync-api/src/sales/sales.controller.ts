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
import { CreateSaleDto } from './dto/create-sale.dto';
import { SalesService } from './sales.service';

@Controller('companies/:companyId/sales')
@UseGuards(RolesGuard)
@Roles(SystemRole.Owner, SystemRole.Sales)
export class SalesController {
  constructor(private readonly service: SalesService) {}

  @Post()
  create(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body() dto: CreateSaleDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.service.create(companyId, dto, userId);
  }

  @Get()
  findAll(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.service.findAll(companyId);
  }

  @Get('customers/list')
  getCustomers(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.service.getCustomers(companyId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post('customers')
  createCustomer(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body()
    dto: { name: string; phone?: string; email?: string; address?: string },
  ) {
    return this.service.createCustomer(companyId, dto);
  }
}
