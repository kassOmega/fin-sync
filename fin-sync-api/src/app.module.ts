import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AutomationModule } from './automation/automation.module';
import { BudgetsModule } from './budgets/budgets.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { CompaniesModule } from './companies/companies.module';
import { CompanyExpensesModule } from './company-expenses/company-expenses.module';
import { CompanyIncomesModule } from './company-incomes/company-incomes.module';
import { EmployeesModule } from './employees/employees.module';
import { MachineriesModule } from './machineries/machineries.module';
import { MeasuringUnitsModule } from './measuring-units/measuring-unts.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PersonalAccountsModule } from './personal-accounts/personal-accounts.module';
import { PersonalExpensesModule } from './personal-expenses/personal-expenses.module';
import { PersonalFinanceModule } from './personal-finance/personal-finance.module';
import { PersonalIncomesModule } from './personal-incomes/personal-incomes.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { ReportsModule } from './reports/reports.module';
import { SavingsModule } from './savings/savings.module';
import { StoreItemsModule } from './store-items/store-items.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CompaniesModule,
    BudgetsModule,
    SavingsModule,
    PersonalExpensesModule,
    CompanyIncomesModule,
    CompanyExpensesModule,
    EmployeesModule,
    MachineriesModule,
    StoreItemsModule,
    ProjectsModule,
    NotificationsModule,
    ReportsModule,
    MeasuringUnitsModule,
    PersonalAccountsModule,
    PersonalIncomesModule,
    PersonalFinanceModule,
    ScheduleModule.forRoot(),
    AutomationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'APP_GUARD',
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
