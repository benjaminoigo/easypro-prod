import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { User } from '../users/user.entity';
import { Writer } from '../writers/writer.entity';
import { Order } from '../orders/order.entity';
import { Submission } from '../submissions/submission.entity';
import { Payment } from '../payments/payment.entity';
import { WritersModule } from '../writers/writers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Writer, Order, Submission, Payment]),
    WritersModule,
  ],
  providers: [AnalyticsService],
  controllers: [AnalyticsController],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}