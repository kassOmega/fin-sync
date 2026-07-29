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

import { PermissionCode } from '../common/constants/permission-codes';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permission.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('reports/cumulative')
  @RequirePermissions(PermissionCode.REPORTS_VIEW)
  getCumulativeReport() {
    return this.service.getCumulativeReport();
  }

  @Get('companies/:companyId/reports')
  @RequirePermissions(PermissionCode.REPORTS_VIEW)
  getCompanyReport(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.getCompanyReport(companyId, startDate, endDate);
  }

  @Get('personal/reports')
  @RequirePermissions(PermissionCode.REPORTS_VIEW)
  getPersonalReport(@CurrentUser('id') userId: number) {
    return this.service.getPersonalReport(userId);
  }

  @Get('companies/:companyId/forecast')
  @RequirePermissions(PermissionCode.REPORTS_VIEW)
  getCompanyForecast(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.service.getCompanyForecast(companyId);
  }

  @Get('machineries/:machineryId/reports')
  @RequirePermissions(PermissionCode.REPORTS_VIEW)
  getMachineryReport(@Param('machineryId', ParseIntPipe) machineryId: number) {
    return this.service.getMachineryReport(machineryId);
  }

  @Get('projects/:projectId/reports')
  @RequirePermissions(PermissionCode.REPORTS_VIEW)
  getProjectReport(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.service.getProjectReport(projectId);
  }

  @Get('companies/:companyId/reports/projects')
  @RequirePermissions(PermissionCode.REPORTS_VIEW)
  getAllProjectsReport(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.service.getAllProjectsReport(companyId);
  }

  @Get('companies/:companyId/reports/machineries')
  @RequirePermissions(PermissionCode.REPORTS_VIEW)
  getAllMachineriesReport(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.service.getAllMachineriesReport(companyId);
  }

  @Get('companies/:companyId/reports/inventory')
  @RequirePermissions(PermissionCode.REPORTS_VIEW)
  getInventoryReport(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.service.getInventoryReport(companyId);
  }

  @Get('companies/:companyId/reports/sales')
  @RequirePermissions(PermissionCode.REPORTS_VIEW)
  getSalesReport(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.getSalesReport(companyId, startDate, endDate);
  }

  @Get('companies/:companyId/reports/purchases')
  @RequirePermissions(PermissionCode.REPORTS_VIEW)
  getPurchasesReport(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.getPurchasesReport(companyId, startDate, endDate);
  }

  @Get('companies/:companyId/reports/export')
  @RequirePermissions(PermissionCode.REPORTS_EXPORT)
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
