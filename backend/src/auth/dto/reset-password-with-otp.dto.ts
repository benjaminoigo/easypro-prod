import { IsEmail, IsString, MinLength } from 'class-validator';

export class ResetPasswordWithOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  otp: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}
