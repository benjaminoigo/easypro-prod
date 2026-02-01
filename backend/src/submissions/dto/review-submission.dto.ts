import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SubmissionStatus } from '../submission.entity';

export class ReviewSubmissionDto {
  @IsEnum(SubmissionStatus)
  status: SubmissionStatus;

  @IsOptional()
  @IsString()
  reviewNotes?: string;
}