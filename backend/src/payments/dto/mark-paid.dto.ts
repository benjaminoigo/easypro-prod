import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaymentMethod } from '../payment.entity';

export class MarkPaidDto {
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsOptional()
  @IsString()
  transactionReference?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}