import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './order.entity';
import { Writer } from '../writers/writer.entity';
import { WriterStatusLog } from '../writers/writer-status-log.entity';
import { WritersModule } from '../writers/writers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Writer, WriterStatusLog]),
    WritersModule,
  ],
  providers: [OrdersService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}