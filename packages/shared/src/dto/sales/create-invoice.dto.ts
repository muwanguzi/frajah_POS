import {
  IsUUID,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsString,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class InvoiceItemDto {
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
  @Type(() => Number)
  discountPercent?: number;
}

export class CreateInvoiceDto {
  @IsUUID()
  customerId: string;

  @IsOptional()
  @IsUUID()
  orderId?: string;

  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];
}
