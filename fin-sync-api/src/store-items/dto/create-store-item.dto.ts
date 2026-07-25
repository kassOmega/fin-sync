import { ItemCategory } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateStoreItemDto {
  @IsString()
  name: string;

  @IsEnum(ItemCategory)
  category: ItemCategory;

  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsNumber()
  @IsOptional()
  lowStockThreshold?: number;
}
