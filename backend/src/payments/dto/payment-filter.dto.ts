import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  IsArray,
  IsUUID,
} from 'class-validator';
import { PaymentMethod, PaymentStatus } from '../payment.entity';

export class PaymentFilterDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value.split(',').map(v => v.trim()).filter(Boolean);
    return undefined;
  })
  @IsArray()
  @IsEnum(PaymentStatus, { each: true })
  statuses?: PaymentStatus[];

  @IsOptional()
  @IsUUID()
  writerId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsDateString()
  periodFrom?: string;

  @IsOptional()
  @IsDateString()
  periodTo?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;
}
