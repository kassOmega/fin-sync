import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class GeneratePayrollDto {
  @IsString()
  title: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsNumber()
  projectId?: number;
}
