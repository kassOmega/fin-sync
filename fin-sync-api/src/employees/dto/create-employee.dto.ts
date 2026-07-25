import { EmploymentType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  name: string;

  @IsEnum(EmploymentType)
  employmentType: EmploymentType;

  @IsNumber()
  @IsOptional()
  wage?: number;

  @IsDateString()
  @IsOptional()
  nextPayDate?: string;
}
