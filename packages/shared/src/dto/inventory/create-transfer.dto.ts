import {
  IsUUID,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TransferItemDto {
  @IsUUID()
  productId: string;

  @IsNumber()
  @Min(0.001)
  @Type(() => Number)
  quantity: number;
}

export class CreateTransferDto {
  @IsUUID()
  fromBranchId: string;

  @IsUUID()
  toBranchId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransferItemDto)
  items: TransferItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}
