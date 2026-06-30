import {
  IsUUID,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReceiveGoodsItemDto {
  @IsUUID()
  purchaseOrderItemId: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  quantityReceived: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  quantityDamaged?: number;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}

export class ReceiveGoodsDto {
  @IsUUID()
  purchaseOrderId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiveGoodsItemDto)
  items: ReceiveGoodsItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}
