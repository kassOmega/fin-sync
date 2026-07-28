import { BudgetType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateSavingDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  targetAmount: number;

  @IsNumber()
  thresholdAmount: number;

  @IsEnum(BudgetType)
  frequency: BudgetType;

  @IsDateString()
  startDate: string;
}
