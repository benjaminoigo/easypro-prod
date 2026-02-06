import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Submission, SubmissionStatus } from './submission.entity';
import { Order, OrderStatus } from '../orders/order.entity';
import { Writer, WriterStatus } from '../writers/writer.entity';
import { Shift } from '../shifts/shift.entity';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { ReviewSubmissionDto } from './dto/review-submission.dto';
import { toRelativeUploadPath } from '../common/uploads/upload-path';

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectRepository(Submission)
    private readonly submissionRepository: Repository<Submission>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Writer)
    private readonly writerRepository: Repository<Writer>,
    @InjectRepository(Shift)
    private readonly shiftRepository: Repository<Shift>,
  ) {}

  async create(
    createSubmissionDto: CreateSubmissionDto,
    writerId: string,
    files?: Express.Multer.File[],
  ): Promise<Submission> {
    // Get writer and validate status
    const writer = await this.writerRepository.findOne({
      where: { id: writerId },
    });

    if (!writer) {
      throw new NotFoundException('Writer not found');
    }

    if (writer.status === WriterStatus.SUSPENDED) {
      throw new ForbiddenException('Suspended writers cannot submit work');
    }

    // Get order and validate
    const order = await this.orderRepository.findOne({
      where: { id: createSubmissionDto.orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.writerId !== writerId) {
      throw new ForbiddenException('You can only submit work for your assigned orders');
    }

    if (order.status === OrderStatus.SUBMITTED || order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot submit work for this order');
    }

    // Get current shift
    const currentShift = await this.getCurrentShift();

    // Validate pages don't exceed remaining pages
    // Removed order and shift page limit checks to allow submitting more than the limit

    // Calculate amount
    const amount = createSubmissionDto.pagesWorked * createSubmissionDto.cpp;

    // Handle multiple files
    const filePaths = files?.map(f => toRelativeUploadPath(f.path, process.env.UPLOAD_DEST)) || [];
    const fileNames = files?.map(f => f.originalname) || [];

    const submissionData = {
      orderId: createSubmissionDto.orderId,
      writerId,
      pagesWorked: createSubmissionDto.pagesWorked,
      cpp: createSubmissionDto.cpp,
      notes: createSubmissionDto.notes,
      amount,
      shiftId: currentShift.id,
      filePath: filePaths[0] || null,
      fileName: fileNames[0] || null,
      filePaths: filePaths,
      fileNames: fileNames,
      status: SubmissionStatus.PENDING,
    };

    const submission = this.submissionRepository.create(submissionData as any);

    const savedSubmission = await this.submissionRepository.save(submission) as unknown as Submission;

    // Update writer shift stats
    const pagesWorked = Number(createSubmissionDto.pagesWorked);
    if (!Number.isFinite(pagesWorked)) {
      throw new BadRequestException('Invalid pages worked');
    }
    writer.currentShiftPages = Number(writer.currentShiftPages) + pagesWorked;
    writer.lastSubmissionDate = new Date();
    await this.writerRepository.save(writer);

    // Mark order as in progress if it was just assigned
    if (order.status === OrderStatus.ASSIGNED) {
      order.status = OrderStatus.IN_PROGRESS;
      await this.orderRepository.save(order);
    }

    return savedSubmission;
  }

  async findAll(): Promise<Submission[]> {
    return this.submissionRepository.find({
      relations: ['order', 'writer', 'writer.user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Submission> {
    const submission = await this.submissionRepository.findOne({
      where: { id },
      relations: ['order', 'writer', 'writer.user'],
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    return submission;
  }

  async findByWriter(writerId: string): Promise<Submission[]> {
    return this.submissionRepository.find({
      where: { writerId },
      relations: ['order'],
      order: { createdAt: 'DESC' },
    });
  }

  async findPendingReviews(): Promise<Submission[]> {
    return this.submissionRepository.find({
      where: { status: SubmissionStatus.PENDING },
      relations: ['order', 'writer', 'writer.user'],
      order: { createdAt: 'ASC' },
    });
  }

  async reviewSubmission(
    id: string,
    reviewDto: ReviewSubmissionDto,
    adminUserId: string,
  ): Promise<Submission> {
    const submission = await this.findOne(id);

    if (submission.status !== SubmissionStatus.PENDING) {
      throw new BadRequestException('Submission has already been reviewed');
    }

    submission.status = reviewDto.status;
    submission.reviewedBy = adminUserId;
    submission.reviewNotes = reviewDto.reviewNotes;
    submission.reviewedAt = new Date();

    const savedSubmission = await this.submissionRepository.save(submission);

    // If approved, update writer balance and order status
    if (reviewDto.status === SubmissionStatus.APPROVED) {
      await this.approveSubmission(submission);
    }

    return savedSubmission;
  }

  async getSubmissionStats(): Promise<any> {
    const stats = await this.submissionRepository
      .createQueryBuilder('submission')
      .select([
        'COUNT(*) as total',
        'COUNT(CASE WHEN status = :pending THEN 1 END) as pending',
        'COUNT(CASE WHEN status = :approved THEN 1 END) as approved',
        'COUNT(CASE WHEN status = :rejected THEN 1 END) as rejected',
        'SUM(CASE WHEN status = :approved THEN amount ELSE 0 END) as totalApprovedAmount',
        'SUM(CASE WHEN status = :approved THEN pages_worked ELSE 0 END) as totalApprovedPages',
      ])
      .setParameters({
        pending: SubmissionStatus.PENDING,
        approved: SubmissionStatus.APPROVED,
        rejected: SubmissionStatus.REJECTED,
      })
      .getRawOne();

    return {
      total: parseInt(stats.total),
      pending: parseInt(stats.pending),
      approved: parseInt(stats.approved),
      rejected: parseInt(stats.rejected),
      totalApprovedAmount: parseFloat(stats.totalApprovedAmount) || 0,
      totalApprovedPages: parseFloat(stats.totalApprovedPages) || 0,
    };
  }

  private async getCurrentShift(): Promise<Shift> {
    const currentShift = await this.shiftRepository.findOne({
      where: { isActive: true },
      order: { startTime: 'DESC' },
    });

    if (!currentShift) {
      throw new BadRequestException('No active shift found');
    }

    return currentShift;
  }

  private async getSubmittedPagesForOrder(orderId: string): Promise<number> {
    const result = await this.submissionRepository
      .createQueryBuilder('submission')
      .select('SUM(submission.pagesWorked)', 'totalPages')
      .where('submission.orderId = :orderId', { orderId })
      .andWhere('submission.status IN (:...statuses)', {
        statuses: [SubmissionStatus.PENDING, SubmissionStatus.APPROVED],
      })
      .getRawOne();

    return parseFloat(result.totalPages) || 0;
  }

  private async approveSubmission(submission: Submission): Promise<void> {
    // Update writer balance
    const writer = await this.writerRepository.findOne({
      where: { id: submission.writerId },
    });

    if (writer) {
      const amount = Number(submission.amount);
      const pagesWorked = Number(submission.pagesWorked);
      if (!Number.isFinite(amount) || !Number.isFinite(pagesWorked)) {
        throw new BadRequestException('Invalid submission values');
      }

      writer.balanceUSD = Number(writer.balanceUSD) + amount;
      writer.lifetimeEarnings = Number(writer.lifetimeEarnings) + amount;
      writer.totalPagesCompleted = Number(writer.totalPagesCompleted) + pagesWorked;
      writer.totalOrdersCompleted = Number(writer.totalOrdersCompleted) + 1;
      await this.writerRepository.save(writer);
    }

    // Check if order is complete and update status
    const order = await this.orderRepository.findOne({
      where: { id: submission.orderId },
    });

    if (order) {
      const totalSubmittedPages = await this.getSubmittedPagesForOrder(order.id);
      if (totalSubmittedPages >= order.pages) {
        order.status = OrderStatus.SUBMITTED;
        await this.orderRepository.save(order);
      }
    }
  }
}
