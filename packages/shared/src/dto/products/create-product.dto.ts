import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsUUID,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BatchCostingMethod } from '../../enums/batch-costing-method.enum';

export class CreateProductDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsString()
  @MaxLength(100)
  sku: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsUUID()
  categoryId: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  unitOfMeasure: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  costPrice: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  sellingPrice: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  wholesalePrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minSellingPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  vatRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  reorderLevel?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  reorderQuantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxStock?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  safetyStock?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isService?: boolean;

  @IsOptional()
  @IsEnum(BatchCostingMethod)
  costingMethod?: BatchCostingMethod;

  @IsOptional()
  @IsBoolean()
  serialTracking?: boolean;

  @IsOptional()
  @IsBoolean()
  batchTracking?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  warrantyPeriod?: number;
}
