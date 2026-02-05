import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePaymentDto {
  @IsString()
  writerId: string;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
