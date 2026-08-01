import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PermissionCode } from '../common/constants/permission-codes';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permission.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { LedgerService } from './ledger.service';

@Controller('companies/:companyId/ledger')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LedgerController {
  constructor(private readonly service: LedgerService) {}

  @Post('entries')
  @RequirePermissions(PermissionCode.LEDGER_POST)
  createEntry(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body() dto: CreateJournalEntryDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.service.createManualEntry(companyId, dto, userId);
  }

  @Get('entries')
  @RequirePermissions(PermissionCode.LEDGER_READ)
  findAll(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('accountId') accountId?: string,
    @Query('sourceType') sourceType?: string,
    @Query('status') status?: string,
    @Query('projectId') projectId?: string,
  ) {
    return this.service.findAll(companyId, {
      startDate,
      endDate,
      accountId: accountId ? parseInt(accountId) : undefined,
      sourceType,
      status,
      projectId: projectId ? parseInt(projectId) : undefined,
    });
  }

  @Get('entries/:id')
  @RequirePermissions(PermissionCode.LEDGER_READ)
  findOne(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.findOne(companyId, id);
  }

  @Post('entries/:id/post')
  @RequirePermissions(PermissionCode.LEDGER_POST)
  postEntry(
    @Param('id', ParseIntPipe) entryId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.service.postEntry(entryId, userId);
  }

  @Post('entries/:id/void')
  @RequirePermissions(PermissionCode.LEDGER_POST)
  voidEntry(
    @Param('id', ParseIntPipe) entryId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.service.voidEntry(entryId, userId);
  }

  @Get('accounts/:accountId')
  @RequirePermissions(PermissionCode.LEDGER_READ)
  getLedger(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('accountId', ParseIntPipe) accountId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.getLedger(companyId, accountId, startDate, endDate);
  }

  @Get('trial-balance')
  @RequirePermissions(PermissionCode.LEDGER_READ)
  getTrialBalance(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query('asOfDate') asOfDate?: string,
  ) {
    return this.service.getTrialBalance(companyId, asOfDate);
  }

  @Get('balance-sheet')
  @RequirePermissions(PermissionCode.LEDGER_READ)
  getBalanceSheet(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query('asOfDate') asOfDate?: string,
  ) {
    return this.service.getBalanceSheet(companyId, asOfDate);
  }

  @Get('income-statement')
  @RequirePermissions(PermissionCode.LEDGER_READ)
  getIncomeStatement(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.service.getIncomeStatement(companyId, startDate, endDate);
  }
}
