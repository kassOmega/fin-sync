import { BudgetType } from '@prisma/client';
import { IsDateString, IsEnum, IsNumber } from 'class-validator';

export class CreateBudgetDto {
  @IsNumber()
  amount: number;

  @IsEnum(BudgetType)
  type: BudgetType;

  @IsDateString()
  startDate: string;
}
