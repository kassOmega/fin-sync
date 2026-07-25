import { BudgetType } from '@prisma/client';
import { IsDateString, IsEnum, IsNumber } from 'class-validator';

export class CreateSavingDto {
  @IsNumber()
  targetAmount: number;

  @IsNumber()
  thresholdAmount: number;

  @IsEnum(BudgetType)
  frequency: BudgetType;

  @IsDateString()
  startDate: string;
}
