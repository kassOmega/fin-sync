import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { AccountsModule } from './accounts/accounts.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AttendanceModule } from './attendance/attendance.module';
import { AuthModule } from './auth/auth.module';
import { AutomationModule } from './automation/automation.module';
import { BudgetsModule } from './budgets/budgets.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { NoStoreInterceptor } from './common/interceptors/no-store.interceptor';
import { CompaniesModule } from './companies/companies.module';
import { CompanyExpensesModule } from './company-expenses/company-expenses.module';
import { CompanyIncomesModule } from './company-incomes/company-incomes.module';
import { CompensationModule } from './compensation/compensation.module';
import { DailyLaborersModule } from './daily-laboreers/daily-laboreers.module';
import { DepreciationsModule } from './depreciations/depreciations.module';
import { EmployeesModule } from './employees/employees.module';
import { LeavesModule } from './leaves/leaves.module';
import { LedgerModule } from './ledger/ledger.module';
import { MachineriesModule } from './machineries/machineries.module';
import { MeasuringUnitsModule } from './measuring-units/measuring-unts.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OvertimeModule } from './overtime/overtime.module';
import { PayrollModule } from './payroll/payroll.module';
import { PersonalAccountsModule } from './personal-accounts/personal-accounts.module';
import { PersonalExpensesModule } from './personal-expenses/personal-expenses.module';
import { PersonalFinanceModule } from './personal-finance/personal-finance.module';
import { PersonalIncomesModule } from './personal-incomes/personal-incomes.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { PurchasesModule } from './purchases/purchases.module';
import { ReportsModule } from './reports/reports.module';
import { RolesModule } from './roles/roles.module';
import { SalesModule } from './sales/sales.module';
import { SavingsModule } from './savings/savings.module';
import { StoreItemsModule } from './store-items/store-items.module';
import { TimesheetsModule } from './timesheets/timesheets.module';
import { UsersModule } from './users/users.module';
import { WorkPositionsModule } from './work-positions/work-positions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AccountsModule,
    AttendanceModule,
    AuthModule,
    UsersModule,
    WorkPositionsModule,
    CompensationModule,
    DailyLaborersModule,
    CompaniesModule,
    BudgetsModule,
    SavingsModule,
    PersonalExpensesModule,
    CompanyIncomesModule,
    CompanyExpensesModule,
    DepreciationsModule,
    EmployeesModule,
    LeavesModule,
    LedgerModule,
    MachineriesModule,
    StoreItemsModule,
    TimesheetsModule,
    ProjectsModule,
    NotificationsModule,
    OvertimeModule,
    PayrollModule,
    ReportsModule,
    RolesModule,
    MeasuringUnitsModule,
    PersonalAccountsModule,
    PersonalIncomesModule,
    PersonalFinanceModule,
    SalesModule,
    PurchasesModule,
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
    {
      provide: 'APP_GUARD',
      useClass: PermissionsGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: NoStoreInterceptor,
    },
  ],
})
export class AppModule {}
