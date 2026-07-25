import { Module } from '@nestjs/common';
import { PersonalExpensesService } from './personal-expenses.service';
import { PersonalExpensesController } from './personal-expenses.controller';

@Module({
  controllers: [PersonalExpensesController],
  providers: [PersonalExpensesService],
})
export class PersonalExpensesModule {}
