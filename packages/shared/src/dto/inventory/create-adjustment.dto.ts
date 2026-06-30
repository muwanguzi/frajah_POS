import {
  IsUUID,
  IsEnum,
  IsNumber,
  Min,
  IsString,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AdjustmentType } from '../../enums/adjustment-type.enum';

export class CreateAdjustmentDto {
  @IsUUID()
  productId: string;

  @IsUUID()
  branchId: string;

  @IsEnum(AdjustmentType)
  type: AdjustmentType;

  @IsNumber()
  @Type(() => Number)
  quantity: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  unitCost?: number;

  @IsString()
  @MaxLength(500)
  reason: string;
}
