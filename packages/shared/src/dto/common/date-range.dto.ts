import { IsDateString, IsOptional } from 'class-validator';

export class DateRangeDto {
  @IsDateString()
  from: string;

  @IsDateString()
  to: string;
}

export class OptionalDateRangeDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
