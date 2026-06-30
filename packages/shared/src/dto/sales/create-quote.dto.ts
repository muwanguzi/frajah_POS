import {
  IsUUID,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsOptional,
  IsString,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QuoteItemDto {
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

export class CreateQuoteDto {
  @IsUUID()
  customerId: string;

  @IsDateString()
  validUntil: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteItemDto)
  items: QuoteItemDto[];
}
