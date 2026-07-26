import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { SystemRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { MeasuringUnitsService } from './measuring-units.service';

@Controller('measuring-units')
@UseGuards(RolesGuard)
export class MeasuringUnitsController {
  constructor(private readonly service: MeasuringUnitsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @Roles(SystemRole.Owner, SystemRole.Storekeeper, SystemRole.Cashier)
  create(@Body() body: { name: string }) {
    return this.service.create(body.name);
  }
}
