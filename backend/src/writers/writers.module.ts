import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WritersService } from './writers.service';
import { WritersController } from './writers.controller';
import { Writer } from './writer.entity';
import { WriterStatusLog } from './writer-status-log.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Writer, WriterStatusLog, User])],
  providers: [WritersService],
  controllers: [WritersController],
  exports: [WritersService],
})
export class WritersModule {}