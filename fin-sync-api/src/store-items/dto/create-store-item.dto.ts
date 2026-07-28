import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateStoreItemDto {
  @IsString()
  name: string;

  @IsNumber()
  categoryId: number;

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
