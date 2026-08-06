import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateStoreItemDto {
  @IsString()
  name: string;

  @IsNumber()
  categoryId: number;

  @IsInt()
  storeId: number;

  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsNumber()
  @IsOptional()
  lowStockThreshold?: number;

  @IsNumber()
  @IsOptional()
  costPrice?: number;

  @IsNumber()
  @IsOptional()
  sellingPrice?: number;

  @IsString()
  @IsOptional()
  unit?: string;
}
