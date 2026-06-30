import { IsUUID, IsString, IsOptional, IsArray, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { PurchaseOrderItemDto } from './purchase-order-item.dto';

export class CreatePurchaseOrderDto {
  @IsUUID()
  supplierId: string;

  @IsUUID()
  branchId: string;

  @IsDateString()
  expectedDate: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items: PurchaseOrderItemDto[];
}

export class UpdatePurchaseOrderDto {
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @IsOptional()
  @IsDateString()
  expectedDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items?: PurchaseOrderItemDto[];
}
