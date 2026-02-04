import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateSubmissionDto {
  @IsString()
  orderId: string;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0.1)
  pagesWorked: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0.01)
  cpp: number;

  @IsOptional()
  @IsString()
  notes?: string;
}