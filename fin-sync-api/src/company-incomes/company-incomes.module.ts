import { Module } from '@nestjs/common';
import { LedgerModule } from '../ledger/ledger.module';
import { CompanyIncomesController } from './company-incomes.controller';
import { CompanyIncomesService } from './company-incomes.service';
import { ProjectIncomesController } from './project-incomes.controller';

@Module({
  imports: [LedgerModule],
  controllers: [CompanyIncomesController, ProjectIncomesController],
  providers: [CompanyIncomesService],
})
export class CompanyIncomesModule {}
