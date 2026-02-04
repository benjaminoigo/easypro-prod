import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WritersService } from './writers.service';
import { WritersController } from './writers.controller';
import { Writer } from './writer.entity';
import { WriterStatusLog } from './writer-status-log.entity';
import { User } from '../users/user.entity';
import { Order } from '../orders/order.entity';
import { Submission } from '../submissions/submission.entity';
import { Shift } from '../shifts/shift.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Writer, WriterStatusLog, User, Order, Submission, Shift])],
  providers: [WritersService],
  controllers: [WritersController],
  exports: [WritersService],
})
export class WritersModule {}