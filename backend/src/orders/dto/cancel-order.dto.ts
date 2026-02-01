import { IsString, IsEnum } from 'class-validator';
import { CancellationConsequence } from '../order.entity';

export class CancelOrderDto {
  @IsString()
  reason: string;

  @IsEnum(CancellationConsequence)
  consequence: CancellationConsequence;
}