import { Module } from '@nestjs/common';
import { CompanyIncomesController } from './company-incomes.controller';
import { CompanyIncomesService } from './company-incomes.service';
import { ProjectIncomesController } from './project-incomes.controller';

@Module({
  controllers: [CompanyIncomesController, ProjectIncomesController],
  providers: [CompanyIncomesService],
})
export class CompanyIncomesModule {}
