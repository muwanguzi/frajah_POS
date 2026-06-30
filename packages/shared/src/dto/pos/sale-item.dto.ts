import { IsUUID, IsNumber, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class SaleItemDto {
  @IsUUID()
  productId: string;

  @IsNumber()
  @Min(0.001)
  @Type(() => Number)
  quantity: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  unitPrice: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  discountPercent?: number;
}
