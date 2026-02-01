import { IsEnum, IsString, IsOptional, IsInt, Min } from 'class-validator';
import { WriterStatus } from '../writer.entity';

export class UpdateWriterStatusDto {
  @IsEnum(WriterStatus)
  status: WriterStatus;

  @IsString()
  reason: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationDays?: number;
}