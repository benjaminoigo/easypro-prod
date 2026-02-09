import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaymentMethod } from '../payment.entity';

export class MarkAllPaidDto {
  @IsOptional()
  @IsUUID()
  writerId?: string;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsOptional()
  @IsString()
  transactionReference?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
