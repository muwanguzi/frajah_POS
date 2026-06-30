import {
  IsUUID,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SaleItemDto } from './sale-item.dto';
import { PaymentDto } from './payment.dto';

export class CreateSaleDto {
  @IsUUID()
  sessionId: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentDto)
  payments: PaymentDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  discountAmount?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
