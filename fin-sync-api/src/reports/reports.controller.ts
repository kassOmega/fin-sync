import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReportsService } from './reports.service';

import { SystemRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller()
@UseGuards(RolesGuard)
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('companies/:companyId/reports')
  @Roles(SystemRole.Owner)
  getCompanyReport(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.getCompanyReport(companyId, startDate, endDate);
  }

  @Get('personal/reports')
  @Roles(SystemRole.Owner)
  getPersonalReport(@CurrentUser('id') userId: number) {
    return this.service.getPersonalReport(userId);
  }

  @Get('companies/:companyId/forecast')
  @Roles(SystemRole.Owner)
  getCompanyForecast(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.service.getCompanyForecast(companyId);
  }
}
