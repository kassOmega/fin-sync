import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
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
  // Add these routes to the class
  @Get('machineries/:machineryId/reports')
  @Roles(SystemRole.Owner)
  getMachineryReport(@Param('machineryId', ParseIntPipe) machineryId: number) {
    return this.service.getMachineryReport(machineryId);
  }

  @Get('projects/:projectId/reports')
  @Roles(SystemRole.Owner)
  getProjectReport(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.service.getProjectReport(projectId);
  }

  @Get('companies/:companyId/reports/projects')
  @Roles(SystemRole.Owner)
  getAllProjectsReport(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.service.getAllProjectsReport(companyId);
  }

  @Get('companies/:companyId/reports/machineries')
  @Roles(SystemRole.Owner)
  getAllMachineriesReport(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.service.getAllMachineriesReport(companyId);
  }

  @Get('companies/:companyId/reports/export')
  @Roles(SystemRole.Owner)
  async exportCompanyReport(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Res() res: Response,
  ) {
    const { incomes, expenses } =
      await this.service.getCompanyExportData(companyId);

    // Create CSV string
    const csvRows = [
      ['Type', 'Date', 'Category', 'Amount', 'Note', 'Registered By'].join(','),
      ...incomes.map((inc) =>
        [
          `Income`,
          new Date(inc.date).toLocaleDateString(),
          `"${inc.category}"`,
          inc.amount,
          `"${inc.note || ''}"`,
          `"${inc.user?.name || ''}"`,
        ].join(','),
      ),
      ...expenses.map((exp) =>
        [
          `Expense`,
          new Date(exp.date).toLocaleDateString(),
          `"${exp.category}"`,
          exp.amount,
          `"${exp.note || ''}"`,
          `"${exp.user?.name || ''}"`,
        ].join(','),
      ),
    ];

    const csvString = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="company_${companyId}_tax_report.csv"`,
    );
    res.status(200).send(csvString);
  }
}
