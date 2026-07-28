import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class SaleItemDto {
  @IsNumber()
  @IsOptional()
  itemId?: number;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  // Fields for creating a new item inline
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  categoryId?: number;

  @IsNumber()
  @IsOptional()
  buyingPrice?: number;

  @IsString()
  @IsOptional()
  unit?: string;
}

export class CreateSaleDto {
  @IsNumber()
  @IsOptional()
  customerId?: number;

  @IsNumber()
  amount: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  discount?: number;

  @IsString()
  @IsOptional()
  note?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];
}
