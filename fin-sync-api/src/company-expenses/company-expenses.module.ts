import { Module } from '@nestjs/common';
import { CompanyExpensesService } from './company-expenses.service';
import { CompanyExpensesController } from './company-expenses.controller';

@Module({
  controllers: [CompanyExpensesController],
  providers: [CompanyExpensesService],
})
export class CompanyExpensesModule {}
