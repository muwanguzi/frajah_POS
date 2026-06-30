import { IsUUID, IsString, Length, Matches } from 'class-validator';

export class Verify2FADto {
  @IsUUID()
  userId: string;

  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'code must be a 6-digit number' })
  code: string;
}
