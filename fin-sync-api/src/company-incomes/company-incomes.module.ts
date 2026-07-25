import { Module } from '@nestjs/common';
import { CompanyIncomesService } from './company-incomes.service';
import { CompanyIncomesController } from './company-incomes.controller';

@Module({
  controllers: [CompanyIncomesController],
  providers: [CompanyIncomesService],
})
export class CompanyIncomesModule {}
