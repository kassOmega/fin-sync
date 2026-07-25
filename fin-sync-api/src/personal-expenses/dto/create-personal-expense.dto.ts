import {
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePersonalExpenseDto {
  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsBoolean()
  @IsOptional()
  isCategorized?: boolean; // Defaults to false in service if not provided

  @IsDateString()
  @IsOptional()
  date?: string;
}
