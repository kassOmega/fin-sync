import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class JournalLineDto {
  @IsNumber()
  accountId: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  debit: number;

  @IsNumber()
  credit: number;
}

export class CreateJournalEntryDto {
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsNumber()
  projectId?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalLineDto)
  lines: JournalLineDto[];
}
