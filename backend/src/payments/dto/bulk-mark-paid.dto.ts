import { ArrayNotEmpty, IsArray, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaymentMethod } from '../payment.entity';

export class BulkMarkPaidDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  paymentIds: string[];

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsOptional()
  @IsString()
  transactionReference?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
