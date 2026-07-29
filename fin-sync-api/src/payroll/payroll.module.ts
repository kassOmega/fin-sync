import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import {
  PayrollController,
  ProjectPayrollController,
} from './payroll.controller';
import { PayrollService } from './payroll.service';

@Module({
  imports: [PrismaModule],
  controllers: [PayrollController, ProjectPayrollController],
  providers: [PayrollService],
})
export class PayrollModule {}
