import { BudgetType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateBudgetDto {
  @IsString()
  category: string;

  @IsNumber()
  amount: number;

  @IsEnum(BudgetType)
  frequency: BudgetType;

  @IsOptional()
  @IsDateString()
  startDate?: string;
}
