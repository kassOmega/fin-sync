import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateCompanyIncomeDto {
  @IsNumber()
  amount: number;

  @IsString()
  category: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsInt()
  @IsOptional()
  projectId?: number;

  @IsInt()
  @IsOptional()
  machineryId?: number;
}
