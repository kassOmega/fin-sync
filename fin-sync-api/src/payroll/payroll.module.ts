import { Module } from '@nestjs/common';
import { DailyLaborersModule } from '../daily-laboreers/daily-laboreers.module';
import { LedgerModule } from '../ledger/ledger.module';
import { PrismaModule } from '../prisma/prisma.module';
import { DeductionsService } from './deductions.service';
import {
  PayrollController,
  ProjectPayrollController,
} from './payroll.controller';
import { PayrollService } from './payroll.service';

@Module({
  imports: [PrismaModule, LedgerModule, DailyLaborersModule],
  controllers: [PayrollController, ProjectPayrollController],
  providers: [PayrollService, DeductionsService],
})
export class PayrollModule {}
