import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus, PaymentMethod } from './payment.entity';
import { Writer } from '../writers/writer.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { MarkPaidDto } from './dto/mark-paid.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Writer)
    private readonly writerRepository: Repository<Writer>,
  ) {}

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const writer = await this.writerRepository.findOne({
      where: { id: createPaymentDto.writerId },
    });

    if (!writer) {
      throw new NotFoundException('Writer not found');
    }

    if (createPaymentDto.amount > writer.balanceUSD) {
      throw new BadRequestException('Payment amount exceeds writer balance');
    }

    const payment = this.paymentRepository.create({
      ...createPaymentDto,
      status: PaymentStatus.PENDING,
    });

    const savedPayment = await this.paymentRepository.save(payment);

    // Deduct amount from writer balance
    writer.balanceUSD = Number(writer.balanceUSD) - createPaymentDto.amount;
    await this.writerRepository.save(writer);

    return savedPayment;
  }

  async findAll(): Promise<Payment[]> {
    return this.paymentRepository.find({
      relations: ['writer', 'writer.user'],
      order: { createdAt: 'DESC' },
    });
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
      order: { createdAt: 'DESC' },
    });
  }

  async getPendingPayments(): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { status: PaymentStatus.PENDING },
      relations: ['writer', 'writer.user'],
      order: { createdAt: 'ASC' },
    });
  }

  async markAsPaid(id: string, markPaidDto: MarkPaidDto, adminUserId: string): Promise<Payment> {
    const payment = await this.findOne(id);

    if (payment.status === PaymentStatus.PAID) {
      throw new BadRequestException('Payment is already marked as paid');
    }

    if (payment.status === PaymentStatus.FAILED) {
      throw new BadRequestException('Cannot mark failed payment as paid');
    }

    payment.status = PaymentStatus.PAID;
    payment.method = markPaidDto.method;
    payment.transactionReference = markPaidDto.transactionReference;
    payment.notes = markPaidDto.notes;
    payment.paidBy = adminUserId;
    payment.paidAt = new Date();

    return this.paymentRepository.save(payment);
  }

  async markAsFailed(id: string, reason: string): Promise<Payment> {
    const payment = await this.findOne(id);

    if (payment.status === PaymentStatus.PAID) {
      throw new BadRequestException('Cannot mark paid payment as failed');
    }

    payment.status = PaymentStatus.FAILED;
    payment.notes = reason;

    const savedPayment = await this.paymentRepository.save(payment);

    // Return amount to writer balance
    const writer = await this.writerRepository.findOne({
      where: { id: payment.writerId },
    });

    if (writer) {
      writer.balanceUSD = Number(writer.balanceUSD) + payment.amount;
      await this.writerRepository.save(writer);
    }

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
    const stats = await this.paymentRepository
      .createQueryBuilder('payment')
      .select([
        'COUNT(*) as total',
        'COUNT(CASE WHEN status = :pending THEN 1 END) as pending',
        'COUNT(CASE WHEN status = :paid THEN 1 END) as paid',
        'COUNT(CASE WHEN status = :failed THEN 1 END) as failed',
        'SUM(CASE WHEN status = :paid THEN amount ELSE 0 END) as totalPaidAmount',
        'SUM(CASE WHEN status = :pending THEN amount ELSE 0 END) as totalPendingAmount',
      ])
      .setParameters({
        pending: PaymentStatus.PENDING,
        paid: PaymentStatus.PAID,
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
}