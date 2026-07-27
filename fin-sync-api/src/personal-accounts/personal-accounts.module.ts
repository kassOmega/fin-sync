import { Module } from '@nestjs/common';
import { PersonalAccountsController } from './personal-accounts.controller';
import { PersonalAccountsService } from './personal-accounts.service';

@Module({
  controllers: [PersonalAccountsController],
  providers: [PersonalAccountsService]
})
export class PersonalAccountsModule {}
