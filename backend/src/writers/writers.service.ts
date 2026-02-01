import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Writer, WriterStatus } from './writer.entity';
import { WriterStatusLog, StatusAction } from './writer-status-log.entity';
import { User } from '../users/user.entity';
import { UpdateWriterStatusDto } from './dto/update-writer-status.dto';

@Injectable()
export class WritersService {
  constructor(
    @InjectRepository(Writer)
    private readonly writerRepository: Repository<Writer>,
    @InjectRepository(WriterStatusLog)
    private readonly statusLogRepository: Repository<WriterStatusLog>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<Writer[]> {
    return this.writerRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Writer> {
    const writer = await this.writerRepository.findOne({
      where: { id },
      relations: ['user', 'statusLogs'],
    });

    if (!writer) {
      throw new NotFoundException('Writer not found');
    }

    return writer;
  }

  async findByUserId(userId: string): Promise<Writer> {
    const writer = await this.writerRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!writer) {
      throw new NotFoundException('Writer profile not found');
    }

    return writer;
  }

  async updateStatus(
    id: string,
    updateStatusDto: UpdateWriterStatusDto,
    adminUserId: string,
  ): Promise<Writer> {
    const writer = await this.findOne(id);
    const previousStatus = writer.status;

    if (previousStatus === updateStatusDto.status) {
      throw new BadRequestException(
        `Writer is already ${updateStatusDto.status}`,
      );
    }

    // Update writer status
    writer.status = updateStatusDto.status;
    const updatedWriter = await this.writerRepository.save(writer);

    // Create status log
    const statusLog = this.statusLogRepository.create({
      writerId: writer.id,
      previousStatus,
      newStatus: updateStatusDto.status,
      action: this.getActionFromStatus(updateStatusDto.status),
      reason: updateStatusDto.reason,
      performedBy: adminUserId,
      durationDays: updateStatusDto.durationDays,
      expiresAt: updateStatusDto.durationDays
        ? new Date(Date.now() + updateStatusDto.durationDays * 24 * 60 * 60 * 1000)
        : undefined,
    });

    await this.statusLogRepository.save(statusLog);

    return updatedWriter;
  }

  async getStatusHistory(id: string): Promise<WriterStatusLog[]> {
    return this.statusLogRepository.find({
      where: { writerId: id },
      order: { createdAt: 'DESC' },
    });
  }

  async updateBalance(id: string, amount: number): Promise<Writer> {
    const writer = await this.findOne(id);
    writer.balanceUSD = Number(writer.balanceUSD) + amount;
    writer.lifetimeEarnings = Number(writer.lifetimeEarnings) + amount;
    return this.writerRepository.save(writer);
  }

  async updateShiftStats(id: string, pages: number, orders: number = 1): Promise<Writer> {
    const writer = await this.findOne(id);
    writer.currentShiftPages += pages;
    writer.currentShiftOrders += orders;
    writer.totalPagesCompleted += pages;
    writer.totalOrdersCompleted += orders;
    return this.writerRepository.save(writer);
  }

  async resetShiftStats(): Promise<void> {
    await this.writerRepository.update(
      {},
      {
        currentShiftPages: 0,
        currentShiftOrders: 0,
      },
    );
  }

  async getWriterAnalytics(id: string): Promise<any> {
    const writer = await this.findOne(id);
    
    // You can add more complex analytics queries here
    return {
      totalEarnings: writer.lifetimeEarnings,
      currentBalance: writer.balanceUSD,
      totalOrders: writer.totalOrdersCompleted,
      totalPages: writer.totalPagesCompleted,
      currentShiftPages: writer.currentShiftPages,
      currentShiftOrders: writer.currentShiftOrders,
      status: writer.status,
      lastSubmission: writer.lastSubmissionDate,
    };
  }

  private getActionFromStatus(status: WriterStatus): StatusAction {
    switch (status) {
      case WriterStatus.ACTIVE:
        return StatusAction.ACTIVATION;
      case WriterStatus.PROBATION:
        return StatusAction.PROBATION;
      case WriterStatus.SUSPENDED:
        return StatusAction.SUSPENSION;
      default:
        return StatusAction.WARNING;
    }
  }
}