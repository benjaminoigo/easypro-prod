import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Payment } from './payment.entity';
import { Writer } from '../writers/writer.entity';
import { Order } from '../orders/order.entity';
import { Submission } from '../submissions/submission.entity';
import { PaymentLog } from './payment-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, PaymentLog, Writer, Order, Submission])],
  providers: [PaymentsService],
  controllers: [PaymentsController],
  exports: [PaymentsService],
})
export class PaymentsModule {}
