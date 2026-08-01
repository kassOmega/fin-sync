import { IsDecimal, IsNumber, IsOptional, IsString } from 'class-validator';

/**
 * Strictly matches the latest `Machinery` model in schema.prisma.
 * Removed `category`/`ownershipType` (not columns); added the real
 * schema fields (make, model, plateNumber, serialNumber, currentMileage,
 * hourlyRate, dailyRate, purchase details, etc.).
 */
export class CreateMachineryDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  type?: string; // default 'OTHER'

  @IsString()
  @IsOptional()
  status?: string; // default 'AVAILABLE'

  @IsString()
  @IsOptional()
  make?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsString()
  @IsOptional()
  plateNumber?: string;

  @IsString()
  @IsOptional()
  serialNumber?: string;

  @IsDecimal({ decimal_digits: '2' })
  @IsOptional()
  currentMileage?: string; // Decimal @db.Decimal(10,2)

  @IsDecimal({ decimal_digits: '2' })
  @IsOptional()
  hourlyRate?: string;

  @IsDecimal({ decimal_digits: '2' })
  @IsOptional()
  dailyRate?: string;

  @IsNumber()
  @IsOptional()
  projectId?: number;

  // Depreciation support
  @IsOptional()
  purchaseDate?: string; // ISO date

  @IsOptional()
  purchaseCost?: number;

  @IsOptional()
  residualValue?: number;

  @IsNumber()
  @IsOptional()
  usefulLifeYears?: number;
}
