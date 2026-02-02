import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Shift } from './shift.entity';
import { Writer } from '../writers/writer.entity';
import { Submission, SubmissionStatus } from '../submissions/submission.entity';
import { User } from '../users/user.entity';

@Injectable()
export class ShiftsService {
  private readonly logger = new Logger(ShiftsService.name);

  constructor(
    @InjectRepository(Shift)
    private readonly shiftRepository: Repository<Shift>,
    @InjectRepository(Writer)
    private readonly writerRepository: Repository<Writer>,
    @InjectRepository(Submission)
    private readonly submissionRepository: Repository<Submission>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getCurrentShift(): Promise<Shift> {
    const now = new Date();
    
    let currentShift = await this.shiftRepository.findOne({
      where: {
        isActive: true,
      },
      order: { startTime: 'DESC' },
    });

    // If no active shift or current shift has expired, create a new one
    if (!currentShift || now > currentShift.endTime) {
      currentShift = await this.createNewShift();
    }

    return currentShift;
  }

  async createNewShift(maxPages: number = 20): Promise<Shift> {
    // End the current active shift
    await this.shiftRepository.update(
      { isActive: true },
      { isActive: false }
    );

    const now = new Date();
    const shiftStart = this.getNextShiftStart(now);
    const shiftEnd = new Date(shiftStart);
    shiftEnd.setHours(5, 59, 59, 999); // 5:59:59.999 AM next day
    shiftEnd.setDate(shiftEnd.getDate() + 1);

    const newShift = this.shiftRepository.create({
      startTime: shiftStart,
      endTime: shiftEnd,
      maxPagesPerShift: maxPages,
      isActive: true,
    });

    const savedShift = await this.shiftRepository.save(newShift);

    // Reset all writers' shift stats
    await this.resetAllWriterShiftStats();

    this.logger.log(`New shift created: ${savedShift.id} (${shiftStart.toISOString()} - ${shiftEnd.toISOString()})`);

    return savedShift;
  }

  @Cron('0 6 * * *') // Every day at 6:00 AM
  async handleShiftCreation() {
    this.logger.log('Creating new shift at 6:00 AM');
    try {
      await this.createNewShift();
      this.logger.log('New shift created successfully');
    } catch (error) {
      this.logger.error('Failed to create new shift', error);
    }
  }

  async getShiftHistory(limit: number = 30): Promise<Shift[]> {
    return this.shiftRepository.find({
      order: { startTime: 'DESC' },
      take: limit,
    });
  }

  async updateShiftMaxPages(maxPages: number): Promise<Shift> {
    const currentShift = await this.getCurrentShift();
    currentShift.maxPagesPerShift = maxPages;
    return this.shiftRepository.save(currentShift);
  }

  private getNextShiftStart(from: Date): Date {
    const shiftStart = new Date(from);
    
    // If it's already past 6 AM today, set for 6 AM tomorrow
    // If it's before 6 AM today, set for 6 AM today
    if (shiftStart.getHours() >= 6) {
      shiftStart.setDate(shiftStart.getDate() + 1);
    }
    
    shiftStart.setHours(6, 0, 0, 0);
    return shiftStart;
  }

  private async resetAllWriterShiftStats(): Promise<void> {
    await this.writerRepository.update(
      {},
      {
        currentShiftPages: 0,
        currentShiftOrders: 0,
      }
    );
  }

  async getShiftStats(): Promise<any> {
    const currentShift = await this.getCurrentShift();
    
    // Get aggregate stats for current shift
    const writers = await this.writerRepository.find({
      select: ['currentShiftPages', 'currentShiftOrders'],
    });

    const totalPages = writers.reduce((sum, writer) => sum + writer.currentShiftPages, 0);
    const totalOrders = writers.reduce((sum, writer) => sum + writer.currentShiftOrders, 0);

    return {
      currentShift: {
        id: currentShift.id,
        startTime: currentShift.startTime,
        endTime: currentShift.endTime,
        maxPagesPerShift: currentShift.maxPagesPerShift,
      },
      stats: {
        totalPages,
        totalOrders,
        activeWriters: writers.filter(w => w.currentShiftOrders > 0).length,
      },
    };
  }

  /**
   * Get writer's shift progress by user ID (for the logged-in writer)
   */
  async getWriterShiftProgress(userId: string): Promise<any> {
    const currentShift = await this.getCurrentShift();
    
    // Find writer by user ID
    const writer = await this.writerRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!writer) {
      return {
        error: 'Writer not found',
        targetPages: currentShift.maxPagesPerShift,
        submittedPages: 0,
        approvedPages: 0,
        pendingPages: 0,
        remainingPages: currentShift.maxPagesPerShift,
        percentComplete: 0,
      };
    }

    return this.calculateWriterProgress(writer, currentShift);
  }

  /**
   * Get writer's shift progress by writer ID (for admin viewing)
   */
  async getWriterShiftProgressByWriterId(writerId: string): Promise<any> {
    const currentShift = await this.getCurrentShift();
    
    const writer = await this.writerRepository.findOne({
      where: { id: writerId },
      relations: ['user'],
    });

    if (!writer) {
      return { error: 'Writer not found' };
    }

    return this.calculateWriterProgress(writer, currentShift);
  }

  /**
   * Get all writers' shift progress for admin dashboard
   */
  async getAllWritersShiftProgress(): Promise<any> {
    const currentShift = await this.getCurrentShift();
    
    const writers = await this.writerRepository.find({
      relations: ['user'],
    });

    const writersProgress = await Promise.all(
      writers.map(async (writer) => {
        const progress = await this.calculateWriterProgress(writer, currentShift);
        return {
          writerId: writer.id,
          writerName: writer.user ? `${writer.user.firstName} ${writer.user.lastName}` : 'Unknown',
          writerEmail: writer.user?.email || 'Unknown',
          ...progress,
        };
      })
    );

    // Sort by percentage complete (descending)
    writersProgress.sort((a, b) => b.percentComplete - a.percentComplete);

    return {
      currentShift: {
        id: currentShift.id,
        startTime: currentShift.startTime,
        endTime: currentShift.endTime,
        targetPages: currentShift.maxPagesPerShift,
      },
      writers: writersProgress,
      summary: {
        totalWriters: writersProgress.length,
        writersAtTarget: writersProgress.filter(w => w.percentComplete >= 100).length,
        writersOnTrack: writersProgress.filter(w => w.percentComplete >= 50 && w.percentComplete < 100).length,
        writersBehind: writersProgress.filter(w => w.percentComplete < 50).length,
        totalApprovedPages: writersProgress.reduce((sum, w) => sum + w.approvedPages, 0),
        totalPendingPages: writersProgress.reduce((sum, w) => sum + w.pendingPages, 0),
      },
    };
  }

  /**
   * Calculate progress for a single writer
   */
  private async calculateWriterProgress(writer: Writer, shift: Shift): Promise<any> {
    // Get submissions for this writer during current shift
    const submissions = await this.submissionRepository.find({
      where: {
        writer: { id: writer.id },
        createdAt: MoreThan(shift.startTime),
      },
      relations: ['order'],
    });

    // Calculate pages from submissions
    let approvedPages = 0;
    let pendingPages = 0;
    let rejectedPages = 0;

    submissions.forEach(sub => {
      const pages = sub.order?.pages || 0;
      switch (sub.status) {
        case SubmissionStatus.APPROVED:
          approvedPages += pages;
          break;
        case SubmissionStatus.PENDING:
          pendingPages += pages;
          break;
        case SubmissionStatus.REJECTED:
          rejectedPages += pages;
          break;
      }
    });

    const submittedPages = approvedPages + pendingPages;
    const targetPages = shift.maxPagesPerShift;
    const remainingPages = Math.max(0, targetPages - approvedPages);
    const percentComplete = targetPages > 0 ? Math.round((approvedPages / targetPages) * 100) : 0;

    return {
      targetPages,
      submittedPages,
      approvedPages,
      pendingPages,
      rejectedPages,
      remainingPages,
      percentComplete,
      isOnTarget: approvedPages >= targetPages,
      shiftStartTime: shift.startTime,
      shiftEndTime: shift.endTime,
      submissionCount: submissions.length,
    };
  }
}