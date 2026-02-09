import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Payment, PaymentStatus, PaymentMethod } from './payment.entity';
import { PaymentLog } from './payment-log.entity';
import { Writer } from '../writers/writer.entity';
import { Order, OrderStatus } from '../orders/order.entity';
import { Submission, SubmissionStatus } from '../submissions/submission.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { MarkPaidDto } from './dto/mark-paid.dto';
import { PaymentFilterDto } from './dto/payment-filter.dto';
import { BulkMarkPaidDto } from './dto/bulk-mark-paid.dto';
import { MarkAllPaidDto } from './dto/mark-all-paid.dto';

interface PaymentComputation {
  orders: Order[];
  submissions: Submission[];
  grossAmount: number;
  totalPages: number;
  baseRate?: number;
}

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(PaymentLog)
    private readonly paymentLogRepository: Repository<PaymentLog>,
    @InjectRepository(Writer)
    private readonly writerRepository: Repository<Writer>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Submission)
    private readonly submissionRepository: Repository<Submission>,
  ) {}

  async create(createPaymentDto: CreatePaymentDto, adminUserId?: string): Promise<Payment> {
    const writer = await this.writerRepository.findOne({
      where: { id: createPaymentDto.writerId },
      relations: ['user'],
    });

    if (!writer) {
      throw new NotFoundException('Writer not found');
    }

    const orderIds = Array.from(new Set(createPaymentDto.orderIds || []));
    if (!orderIds.length) {
      throw new BadRequestException('At least one order is required for payment');
    }

    await this.ensureOrdersNotAlreadyQueued(orderIds);
    const computation = await this.validateOrdersAndCompute(writer.id, orderIds);

    const bonusAmount = this.toNumberOrZero(createPaymentDto.bonusAmount);
    const deductionAmount = this.toNumberOrZero(createPaymentDto.deductionAmount);
    const platformFee = this.toNumberOrZero(createPaymentDto.platformFee);
    const manualAmount = createPaymentDto.manualAmount !== undefined
      ? this.toNumber(createPaymentDto.manualAmount, 'Invalid manual amount')
      : createPaymentDto.amount !== undefined
        ? this.toNumber(createPaymentDto.amount, 'Invalid payment amount')
        : undefined;

    const grossAmount = manualAmount !== undefined ? manualAmount : computation.grossAmount;
    let netAmount = grossAmount + bonusAmount - deductionAmount - platformFee;

    if (!Number.isFinite(netAmount) || netAmount <= 0) {
      throw new BadRequestException('Net payment must be greater than zero');
    }

    if (netAmount > Number(writer.balanceUSD)) {
      throw new BadRequestException('Payment amount exceeds writer balance');
    }

    const payment = this.paymentRepository.create({
      writerId: writer.id,
      amount: netAmount,
      status: PaymentStatus.PAYMENT_PENDING,
      method: createPaymentDto.method,
      transactionReference: createPaymentDto.transactionReference,
      notes: createPaymentDto.notes,
      currency: createPaymentDto.currency || 'KSH',
      orderIds,
      approvedPages: computation.totalPages,
      baseRate: computation.baseRate,
      grossAmount,
      bonusAmount,
      deductionAmount,
      platformFee,
      paymentPeriodStart: createPaymentDto.paymentPeriodStart
        ? new Date(createPaymentDto.paymentPeriodStart)
        : undefined,
      paymentPeriodEnd: createPaymentDto.paymentPeriodEnd
        ? new Date(createPaymentDto.paymentPeriodEnd)
        : undefined,
    });

    const savedPayment = await this.paymentRepository.save(payment);

    // Deduct amount from writer balance to reserve funds
    writer.balanceUSD = Number(writer.balanceUSD) - netAmount;
    await this.writerRepository.save(writer);

    await this.logTransaction({
      payment: savedPayment,
      status: PaymentStatus.PAYMENT_PENDING,
      method: createPaymentDto.method,
      processedBy: adminUserId,
      notes: createPaymentDto.notes,
      notificationSent: false,
    });

    return savedPayment;
  }

  async findAll(filter?: PaymentFilterDto): Promise<Payment[]> {
    const qb = this.buildFilterQuery(filter);
    return qb.getMany();
  }

  async findAllWithMeta(filter?: PaymentFilterDto): Promise<{ data: Payment[]; total: number }> {
    const qb = this.buildFilterQuery(filter);
    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['writer', 'writer.user'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async findByWriter(writerId: string): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { writerId },
      relations: ['writer', 'writer.user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getPendingPayments(filter?: PaymentFilterDto): Promise<{ data: Payment[]; total: number }> {
    const withStatuses: PaymentFilterDto = {
      ...filter,
      statuses: filter?.statuses?.length
        ? filter.statuses
        : [
            PaymentStatus.PENDING,
            PaymentStatus.PAYMENT_PENDING,
            PaymentStatus.APPROVED,
            PaymentStatus.PENDING_APPROVAL,
          ],
    };
    return this.findAllWithMeta(withStatuses);
  }

  async markAsPaid(id: string, markPaidDto: MarkPaidDto, adminUserId: string): Promise<Payment> {
    const payment = await this.findOne(id);

    if (payment.status === PaymentStatus.PAID) {
      throw new BadRequestException('Payment is already marked as paid');
    }

    if (payment.status === PaymentStatus.FAILED || payment.status === PaymentStatus.CANCELLED) {
      throw new BadRequestException('Cannot mark failed or cancelled payment as paid');
    }

    payment.status = PaymentStatus.PAID;
    payment.method = markPaidDto.method;
    payment.transactionReference = markPaidDto.transactionReference;
    payment.notes = markPaidDto.notes;
    payment.paidBy = adminUserId;
    payment.paidAt = new Date();
    payment.processedAt = payment.paidAt;

    const savedPayment = await this.paymentRepository.save(payment);

    await this.logTransaction({
      payment: savedPayment,
      status: PaymentStatus.PAID,
      method: markPaidDto.method,
      processedBy: adminUserId,
      notes: markPaidDto.notes,
      notificationSent: false,
    });

    await this.sendPaymentNotification(savedPayment);
    return savedPayment;
  }

  async markSelectedAsPaid(dto: BulkMarkPaidDto, adminUserId: string): Promise<Payment[]> {
    const results: Payment[] = [];
    for (const id of dto.paymentIds) {
      const payment = await this.markAsPaid(
        id,
        {
          method: dto.method,
          transactionReference: dto.transactionReference,
          notes: dto.notes,
        },
        adminUserId,
      );
      results.push(payment);
    }
    return results;
  }

  async markAllAsPaid(dto: MarkAllPaidDto, adminUserId: string): Promise<Payment[]> {
    const qb = this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.status IN (:...statuses)', {
        statuses: [
          PaymentStatus.PENDING,
          PaymentStatus.PAYMENT_PENDING,
          PaymentStatus.APPROVED,
          PaymentStatus.PENDING_APPROVAL,
        ],
      });

    if (dto.writerId) {
      qb.andWhere('payment.writerId = :writerId', { writerId: dto.writerId });
    }

    const payments = await qb.getMany();
    if (!payments.length) {
      throw new BadRequestException('No pending payments to mark as paid');
    }

    const results: Payment[] = [];
    for (const payment of payments) {
      const updated = await this.markAsPaid(
        payment.id,
        {
          method: dto.method,
          transactionReference: dto.transactionReference,
          notes: dto.notes,
        },
        adminUserId,
      );
      results.push(updated);
    }

    return results;
  }

  async markAsFailed(id: string, reason: string, adminUserId?: string): Promise<Payment> {
    const payment = await this.findOne(id);

    if (payment.status === PaymentStatus.PAID) {
      throw new BadRequestException('Cannot mark paid payment as failed');
    }

    payment.status = PaymentStatus.FAILED;
    payment.notes = reason;
    payment.processedAt = new Date();

    const savedPayment = await this.paymentRepository.save(payment);

    // Return amount to writer balance
    const writer = await this.writerRepository.findOne({
      where: { id: payment.writerId },
    });

    if (writer) {
      const amount = Number(payment.amount);
      if (!Number.isFinite(amount)) {
        throw new BadRequestException('Invalid payment amount');
      }
      writer.balanceUSD = Number(writer.balanceUSD) + amount;
      await this.writerRepository.save(writer);
    }

    await this.logTransaction({
      payment: savedPayment,
      status: PaymentStatus.FAILED,
      method: payment.method,
      processedBy: adminUserId,
      notes: reason,
      notificationSent: false,
    });

    return savedPayment;
  }

  async getTotalPayableAmount(): Promise<number> {
    const writers = await this.writerRepository
      .createQueryBuilder('writer')
      .select('SUM(writer.balanceUSD)', 'total')
      .getRawOne();

    return parseFloat(writers.total) || 0;
  }

  async getPaymentStats(): Promise<any> {
    const pendingStatuses = [
      PaymentStatus.PENDING,
      PaymentStatus.PAYMENT_PENDING,
      PaymentStatus.APPROVED,
      PaymentStatus.PENDING_APPROVAL,
    ];

    const stats = await this.paymentRepository
      .createQueryBuilder('payment')
      .select([
        'COUNT(*) as total',
        'COUNT(CASE WHEN payment.status = :paid THEN 1 END) as paid',
        'COUNT(CASE WHEN payment.status IN (:...pending) THEN 1 END) as pending',
        'COUNT(CASE WHEN payment.status = :failed THEN 1 END) as failed',
        'SUM(CASE WHEN payment.status = :paid THEN payment.amount ELSE 0 END) as totalPaidAmount',
        'SUM(CASE WHEN payment.status IN (:...pending) THEN payment.amount ELSE 0 END) as totalPendingAmount',
      ])
      .setParameters({
        paid: PaymentStatus.PAID,
        pending: pendingStatuses,
        failed: PaymentStatus.FAILED,
      })
      .getRawOne();

    const totalPayable = await this.getTotalPayableAmount();

    return {
      total: parseInt(stats.total),
      pending: parseInt(stats.pending),
      paid: parseInt(stats.paid),
      failed: parseInt(stats.failed),
      totalPaidAmount: parseFloat(stats.totalPaidAmount) || 0,
      totalPendingAmount: parseFloat(stats.totalPendingAmount) || 0,
      totalPayableAmount: totalPayable,
    };
  }

  private buildFilterQuery(filter?: PaymentFilterDto) {
    const qb = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.writer', 'writer')
      .leftJoinAndSelect('writer.user', 'user')
      .orderBy('payment.createdAt', 'DESC');

    if (filter?.statuses?.length) {
      qb.andWhere('payment.status IN (:...statuses)', { statuses: filter.statuses });
    }

    if (filter?.writerId) {
      qb.andWhere('payment.writerId = :writerId', { writerId: filter.writerId });
    }

    if (filter?.method) {
      qb.andWhere('payment.method = :method', { method: filter.method });
    }

    if (filter?.search) {
      const search = `%${filter.search.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(user.firstName) LIKE :search OR LOWER(user.lastName) LIKE :search OR payment.writerId = :exactSearch)',
        { search, exactSearch: filter.search },
      );
    }

    if (filter?.from) {
      qb.andWhere('payment.createdAt >= :from', { from: new Date(filter.from) });
    }

    if (filter?.to) {
      qb.andWhere('payment.createdAt <= :to', { to: new Date(filter.to) });
    }

    if (filter?.periodFrom) {
      qb.andWhere('payment.paymentPeriodStart >= :periodFrom', {
        periodFrom: new Date(filter.periodFrom),
      });
    }

    if (filter?.periodTo) {
      qb.andWhere('payment.paymentPeriodEnd <= :periodTo', {
        periodTo: new Date(filter.periodTo),
      });
    }

    return qb;
  }

  private async validateOrdersAndCompute(writerId: string, orderIds: string[]): Promise<PaymentComputation> {
    const orders = await this.orderRepository.find({
      where: { id: In(orderIds), writerId },
    });

    if (orders.length !== orderIds.length) {
      throw new BadRequestException('One or more orders are invalid or not assigned to the writer');
    }

    const ineligible = orders.filter(order => order.status !== OrderStatus.SUBMITTED);
    if (ineligible.length) {
      throw new BadRequestException('Only approved/completed orders can be paid');
    }

    const submissions = await this.submissionRepository.find({
      where: {
        orderId: In(orderIds),
        writerId,
        status: SubmissionStatus.APPROVED,
      },
    });

    if (!submissions.length) {
      throw new BadRequestException('No approved submissions found for the selected orders');
    }

    const totalPages = submissions.reduce((sum, sub) => sum + Number(sub.pagesWorked || 0), 0);
    if (!Number.isFinite(totalPages) || totalPages <= 0) {
      throw new BadRequestException('Orders must have completed work before payment');
    }

    const grossAmount = submissions.reduce((sum, sub) => sum + Number(sub.amount || 0), 0);
    const baseRate = totalPages > 0 ? grossAmount / totalPages : undefined;

    return { orders, submissions, grossAmount, totalPages, baseRate };
  }

  private async ensureOrdersNotAlreadyQueued(orderIds: string[]): Promise<void> {
    if (!orderIds.length) return;

    const params: Record<string, any> = {
      activeStatuses: [
        PaymentStatus.PENDING,
        PaymentStatus.PAYMENT_PENDING,
        PaymentStatus.APPROVED,
        PaymentStatus.PENDING_APPROVAL,
        PaymentStatus.PAID,
      ],
    };

    const clauses = orderIds.map((id, index) => {
      const paramName = `order${index}`;
      params[paramName] = id;
      return `:${paramName} = ANY(string_to_array(payment.order_ids, ','))`;
    });

    const qb = this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.status IN (:...activeStatuses)', params)
      .andWhere(clauses.join(' OR '), params);

    const existing = await qb.getMany();
    if (existing.length) {
      throw new BadRequestException('One or more orders are already queued or paid');
    }
  }

  private async logTransaction(params: {
    payment: Payment;
    status: PaymentStatus;
    method?: PaymentMethod;
    processedBy?: string;
    notes?: string;
    notificationSent?: boolean;
  }): Promise<PaymentLog> {
    const log = this.paymentLogRepository.create({
      paymentId: params.payment.id,
      transactionId: this.generateTransactionId(),
      writerId: params.payment.writerId,
      orderIds: params.payment.orderIds,
      amount: params.payment.amount,
      currency: params.payment.currency,
      status: params.status,
      paymentMethod: params.method ?? params.payment.method,
      processedBy: params.processedBy,
      processedAt: new Date(),
      notificationSent: params.notificationSent ?? false,
      notes: params.notes ?? params.payment.notes,
    });

    return this.paymentLogRepository.save(log);
  }

  private async sendPaymentNotification(payment: Payment): Promise<void> {
    if (payment.notificationSent) return;

    payment.notificationSent = true;
    payment.notificationSentAt = new Date();
    await this.paymentRepository.save(payment);

    const note = [
      `Notification sent | Subject: Payment Processed - Ksh ${payment.amount?.toFixed(2)}`,
      `Orders: ${payment.orderIds?.join(', ') || 'N/A'}`,
      `Method: ${payment.method || 'unspecified'}`,
      `Txn Ref: ${payment.transactionReference || 'N/A'}`,
    ].join(' | ');

    await this.logTransaction({
      payment,
      status: payment.status,
      method: payment.method,
      processedBy: payment.paidBy,
      notes: note,
      notificationSent: true,
    });
  }

  private generateTransactionId(): string {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timePart = `${now.getHours().toString().padStart(2, '0')}${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `TXN-${datePart}${timePart}-${random}`;
  }

  private toNumber(value: any, message: string): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      throw new BadRequestException(message);
    }
    return parsed;
  }

  private toNumberOrZero(value: any): number {
    if (value === undefined || value === null) return 0;
    return this.toNumber(value, 'Invalid numeric value');
  }
}
