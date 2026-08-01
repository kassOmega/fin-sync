import { Module } from '@nestjs/common';
import { LedgerModule } from '../ledger/ledger.module';
import { CompanyExpensesController } from './company-expenses.controller';
import { CompanyExpensesService } from './company-expenses.service';
import { ProjectExpensesController } from './project-expenses.controller';

@Module({
  imports: [LedgerModule],
  controllers: [CompanyExpensesController, ProjectExpensesController],
  providers: [CompanyExpensesService],
})
export class CompanyExpensesModule {}
