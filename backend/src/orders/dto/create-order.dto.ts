import { IsString, IsNumber, IsDateString, IsOptional, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateOrderDto {
  @IsOptional()
  @IsString()
  orderNumber?: string; // Optional - will be auto-generated if not provided

  @IsString()
  subject: string;

  @IsDateString()
  deadline: Date;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0.1)
  pages: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0.01)
  cpp: number; // Cost per page

  @IsOptional()
  @IsString()
  writerId?: string;

  @IsOptional()
  @IsString()
  instructions?: string;
}