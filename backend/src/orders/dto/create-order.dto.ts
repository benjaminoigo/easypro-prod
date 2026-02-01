import { IsString, IsInt, IsNumber, IsDateString, IsOptional, Min } from 'class-validator';

export class CreateOrderDto {
  @IsOptional()
  @IsString()
  orderNumber?: string; // Optional - will be auto-generated if not provided

  @IsString()
  subject: string;

  @IsDateString()
  deadline: Date;

  @IsInt()
  @Min(1)
  pages: number;

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