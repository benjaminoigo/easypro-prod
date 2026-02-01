import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto';
import { IsOptional, IsEnum, IsInt, IsNumber, Min } from 'class-validator';
import { OrderStatus } from '../order.entity';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  pages?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  cpp?: number;

  @IsOptional()
  totalAmount?: number;
}