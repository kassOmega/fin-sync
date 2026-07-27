import { Module } from '@nestjs/common';
import { PersonalIncomesService } from './personal-incomes.service';
import { PersonalIncomesController } from './personal-incomes.controller';

@Module({
  controllers: [PersonalIncomesController],
  providers: [PersonalIncomesService],
})
export class PersonalIncomesModule {}
