import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { SubmissionsService } from './submissions.service';
import { SubmissionsController } from './submissions.controller';
import { Submission } from './submission.entity';
import { Order } from '../orders/order.entity';
import { Writer } from '../writers/writer.entity';
import { Shift } from '../shifts/shift.entity';
import { WritersModule } from '../writers/writers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Submission, Order, Writer, Shift]),
    WritersModule,
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        storage: diskStorage({
          destination: configService.get<string>('UPLOAD_DEST', './uploads'),
          filename: (req, file, callback) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = extname(file.originalname);
            const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
            callback(null, filename);
          },
        }),
        limits: {
          fileSize: configService.get<number>('MAX_FILE_SIZE', 10485760), // 10MB
        },
        fileFilter: (req, file, callback) => {
          if (file.mimetype.match(/\/(jpg|jpeg|png|gif|pdf|doc|docx|txt)$/)) {
            callback(null, true);
          } else {
            callback(new Error('Unsupported file type'), false);
          }
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [SubmissionsService],
  controllers: [SubmissionsController],
  exports: [SubmissionsService],
})
export class SubmissionsModule {}