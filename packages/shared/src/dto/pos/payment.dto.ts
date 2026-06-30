import { IsEnum, IsNumber, Min, IsOptional, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../../enums/payment-method.enum';

export class PaymentDto {
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reference?: string;
}
