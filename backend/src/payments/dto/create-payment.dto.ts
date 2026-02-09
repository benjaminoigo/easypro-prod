import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  IsArray,
  ArrayNotEmpty,
  IsEnum,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PaymentMethod } from '../payment.entity';

export class CreatePaymentDto {
  @IsString()
  writerId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  orderIds: string[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? value : parseFloat(value)))
  @IsNumber()
  @Min(0)
  bonusAmount?: number;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? value : parseFloat(value)))
  @IsNumber()
  @Min(0)
  deductionAmount?: number;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? value : parseFloat(value)))
  @IsNumber()
  @Min(0)
  platformFee?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsDateString()
  paymentPeriodStart?: string;

  @IsOptional()
  @IsDateString()
  paymentPeriodEnd?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @IsOptional()
  @IsString()
  transactionReference?: string;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? value : parseFloat(value)))
  @IsNumber()
  @Min(0.01)
  manualAmount?: number;

  // Backwards compatibility with previous API where amount was required
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? value : parseFloat(value)))
  @IsNumber()
  @Min(0.01)
  amount?: number;
}
