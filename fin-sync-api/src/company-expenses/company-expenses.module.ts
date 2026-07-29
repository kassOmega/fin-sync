import { Module } from '@nestjs/common';
import { CompanyExpensesController } from './company-expenses.controller';
import { CompanyExpensesService } from './company-expenses.service';
import { ProjectExpensesController } from './project-expenses.controller';

@Module({
  controllers: [CompanyExpensesController, ProjectExpensesController],
  providers: [CompanyExpensesService],
})
export class CompanyExpensesModule {}
