import { IsUUID, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PurchaseOrderItemDto {
  @IsUUID()
  productId: string;

  @IsNumber()
  @Min(0.001)
  @Type(() => Number)
  quantityOrdered: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  unitCost: number;
}
