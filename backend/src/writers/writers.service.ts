import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Writer, WriterStatus } from './writer.entity';
import { WriterStatusLog, StatusAction } from './writer-status-log.entity';
import { User } from '../users/user.entity';
import { UpdateWriterStatusDto } from './dto/update-writer-status.dto';
import { Order, OrderStatus } from '../orders/order.entity';
import { Submission, SubmissionStatus } from '../submissions/submission.entity';
import { Shift } from '../shifts/shift.entity';

@Injectable()
export class WritersService {
  constructor(
    @InjectRepository(Writer)
    private readonly writerRepository: Repository<Writer>,
    @InjectRepository(WriterStatusLog)
    private readonly statusLogRepository: Repository<WriterStatusLog>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Submission)
    private readonly submissionRepository: Repository<Submission>,
    @InjectRepository(Shift)
    private readonly shiftRepository: Repository<Shift>,
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

  async findByUserId(userId: string): Promise<any> {
    const writer = await this.writerRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!writer) {
      throw new NotFoundException('Writer profile not found');
    }

    // Get current shift
    const now = new Date();
    const currentShift = await this.shiftRepository
      .createQueryBuilder('shift')
      .where('shift.startTime <= :now', { now })
      .andWhere('shift.endTime > :now', { now })
      .andWhere('shift.isActive = true')
      .getOne();

    const maxPagesPerShift = currentShift?.maxPagesPerShift || 20;

    // Get assigned orders for this shift (pages assigned in current shift)
    const shiftStart = currentShift?.startTime || new Date();
    const assignedOrders = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.pages)', 'totalPages')
      .addSelect('COUNT(*)', 'totalOrders')
      .where('order.writerId = :writerId', { writerId: writer.id })
      .andWhere('order.createdAt >= :shiftStart', { shiftStart })
      .andWhere('order.status != :cancelled', { cancelled: OrderStatus.CANCELLED })
      .getRawOne();

    const currentShiftAssignedPages = parseFloat(assignedOrders?.totalPages) || 0;
    const currentShiftAssignedOrders = parseInt(assignedOrders?.totalOrders) || 0;

    // Get total statistics
    const totalOrders = await this.orderRepository.count({
      where: { writerId: writer.id },
    });

    const completedOrders = await this.orderRepository.count({
      where: { writerId: writer.id, status: OrderStatus.SUBMITTED },
    });

    // Check if writer has reached the limit
    const hasReachedLimit = currentShiftAssignedPages >= maxPagesPerShift;
    const remainingPages = Math.max(maxPagesPerShift - currentShiftAssignedPages, 0);

    return {
      ...writer,
      totalOrders,
      completedOrders,
      totalEarnings: writer.lifetimeEarnings,
      currentBalance: writer.balanceUSD,
      pendingPayments: 0, // TODO: calculate from pending payments
      averageRating: 4.5, // TODO: implement rating system
      
      // Shift tracking
      currentShiftPages: currentShiftAssignedPages,
      currentShiftOrders: currentShiftAssignedOrders,
      maxPagesPerShift,
      hasReachedLimit,
      remainingPages,
      
      // Shift info
      shiftActive: !!currentShift,
      shiftStart: currentShift?.startTime,
      shiftEnd: currentShift?.endTime,
    };
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

    // Invalidate existing tokens when status changes
    const user = await this.userRepository.findOne({ where: { id: writer.userId } });
    if (user) {
      user.tokenVersion = (user.tokenVersion ?? 0) + 1;
      await this.userRepository.save(user);
    }

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
    const amountValue = Number(amount);
    if (!Number.isFinite(amountValue)) {
      throw new BadRequestException('Invalid amount');
    }
    writer.balanceUSD = Number(writer.balanceUSD) + amountValue;
    writer.lifetimeEarnings = Number(writer.lifetimeEarnings) + amountValue;
    return this.writerRepository.save(writer);
  }

  async updateShiftStats(id: string, pages: number, orders: number = 1): Promise<Writer> {
    const writer = await this.findOne(id);
    const pagesValue = Number(pages);
    const ordersValue = Number(orders);
    if (!Number.isFinite(pagesValue) || !Number.isFinite(ordersValue)) {
      throw new BadRequestException('Invalid shift stats');
    }
    writer.currentShiftPages = Number(writer.currentShiftPages) + pagesValue;
    writer.currentShiftOrders = Number(writer.currentShiftOrders) + ordersValue;
    writer.totalPagesCompleted = Number(writer.totalPagesCompleted) + pagesValue;
    writer.totalOrdersCompleted = Number(writer.totalOrdersCompleted) + ordersValue;
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
