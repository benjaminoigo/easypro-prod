import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Writer } from '../writers/writer.entity';
import { Order, OrderStatus } from '../orders/order.entity';
import { Submission, SubmissionStatus } from '../submissions/submission.entity';
import { Payment, PaymentStatus } from '../payments/payment.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Writer)
    private readonly writerRepository: Repository<Writer>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Submission)
    private readonly submissionRepository: Repository<Submission>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  async getAdminDashboard(): Promise<any> {
    const [
      totalUsers,
      totalWriters,
      orderStats,
      submissionStats,
      paymentStats,
      recentOrders,
      pendingSubmissions,
      pendingPayments,
    ] = await Promise.all([
      this.getTotalUsers(),
      this.getTotalWriters(),
      this.getOrderStats(),
      this.getSubmissionStats(),
      this.getPaymentStats(),
      this.getRecentOrders(5),
      this.getPendingSubmissions(5),
      this.getPendingPayments(5),
    ]);

    return {
      overview: {
        totalUsers,
        totalWriters,
        ...orderStats,
        ...submissionStats,
        ...paymentStats,
      },
      recentActivity: {
        recentOrders,
        pendingSubmissions,
        pendingPayments,
      },
    };
  }

  async getOrdersPerDayChart(days: number = 30): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await this.orderRepository
      .createQueryBuilder('order')
      .select([
        'DATE(order.createdAt) as date',
        'COUNT(*) as count',
        'COUNT(CASE WHEN order.status = :submitted THEN 1 END) as completed',
      ])
      .where('order.createdAt >= :startDate', { startDate })
      .groupBy('DATE(order.createdAt)')
      .orderBy('DATE(order.createdAt)', 'ASC')
      .setParameter('submitted', OrderStatus.SUBMITTED)
      .getRawMany();

    return orders.map(order => ({
      date: order.date,
      total: parseInt(order.count),
      completed: parseInt(order.completed),
    }));
  }

  async getEarningsPerWriterChart(): Promise<any[]> {
    const earnings = await this.writerRepository
      .createQueryBuilder('writer')
      .leftJoin('writer.user', 'user')
      .select([
        'user.firstName',
        'user.lastName',
        'writer.lifetimeEarnings as earnings',
        'writer.currentShiftPages as currentShiftPages',
        'writer.status',
      ])
      .orderBy('writer.lifetimeEarnings', 'DESC')
      .limit(10)
      .getRawMany();

    return earnings.map(earning => ({
      name: `${earning.firstName} ${earning.lastName}`,
      earnings: parseFloat(earning.earnings) || 0,
      currentShiftPages: parseInt(earning.currentShiftPages) || 0,
      status: earning.status,
    }));
  }

  async getPagesPerShiftChart(days: number = 14): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const submissions = await this.submissionRepository
      .createQueryBuilder('submission')
      .select([
        'DATE(submission.createdAt) as date',
        'SUM(submission.pagesWorked) as totalPages',
        'COUNT(DISTINCT submission.writerId) as activeWriters',
      ])
      .where('submission.createdAt >= :startDate', { startDate })
      .andWhere('submission.status = :approved', { approved: SubmissionStatus.APPROVED })
      .groupBy('DATE(submission.createdAt)')
      .orderBy('DATE(submission.createdAt)', 'ASC')
      .getRawMany();

    return submissions.map(submission => ({
      date: submission.date,
      pages: parseInt(submission.totalPages) || 0,
      activeWriters: parseInt(submission.activeWriters) || 0,
    }));
  }

  async getWriterAnalytics(writerId: string): Promise<any> {
    const writer = await this.writerRepository.findOne({
      where: { id: writerId },
      relations: ['user'],
    });

    if (!writer) {
      throw new Error('Writer not found');
    }

    const [submissions, payments, monthlyEarnings] = await Promise.all([
      this.getWriterSubmissions(writerId),
      this.getWriterPayments(writerId),
      this.getWriterMonthlyEarnings(writerId, 12),
    ]);

    return {
      profile: {
        name: writer.user.fullName,
        status: writer.status,
        lifetimeEarnings: writer.lifetimeEarnings,
        currentBalance: writer.balanceUSD,
        totalOrdersCompleted: writer.totalOrdersCompleted,
        totalPagesCompleted: writer.totalPagesCompleted,
        currentShiftPages: writer.currentShiftPages,
        currentShiftOrders: writer.currentShiftOrders,
      },
      submissions,
      payments,
      monthlyEarnings,
    };
  }

  private async getTotalUsers(): Promise<number> {
    return this.userRepository.count();
  }

  private async getTotalWriters(): Promise<number> {
    return this.writerRepository.count();
  }

  private async getOrderStats(): Promise<any> {
    const stats = await this.orderRepository
      .createQueryBuilder('order')
      .select([
        'COUNT(*) as totalOrders',
        'COUNT(CASE WHEN status = :completed THEN 1 END) as completedOrders',
        'SUM(CASE WHEN status = :completed THEN order."totalAmount" ELSE 0 END) as totalCompleted',
      ])
      .setParameter('completed', OrderStatus.SUBMITTED)
      .getRawOne();

    return {
      totalOrders: parseInt(stats.totalOrders || '0'),
      completedOrders: parseInt(stats.completedOrders || '0'),
      totalCompletedAmount: parseFloat(stats.totalCompleted) || 0,
    };
  }

  private async getSubmissionStats(): Promise<any> {
    const stats = await this.submissionRepository
      .createQueryBuilder('submission')
      .select([
        'COUNT(*) as totalSubmissions',
        'COUNT(CASE WHEN status = :pending THEN 1 END) as pendingSubmissions',
        'SUM(CASE WHEN status = :approved THEN pages_worked ELSE 0 END) as totalPages',
      ])
      .setParameters({
        pending: SubmissionStatus.PENDING,
        approved: SubmissionStatus.APPROVED,
      })
      .getRawOne();

    return {
      totalSubmissions: parseInt(stats.totalSubmissions),
      pendingSubmissions: parseInt(stats.pendingSubmissions),
      totalApprovedPages: parseInt(stats.totalPages) || 0,
    };
  }

  private async getPaymentStats(): Promise<any> {
    const stats = await this.paymentRepository
      .createQueryBuilder('payment')
      .select([
        'SUM(CASE WHEN status = :paid THEN amount ELSE 0 END) as totalPaid',
        'SUM(CASE WHEN status = :pending THEN amount ELSE 0 END) as totalPending',
      ])
      .setParameters({
        paid: PaymentStatus.PAID,
        pending: PaymentStatus.PENDING,
      })
      .getRawOne();

    const totalPayable = await this.writerRepository
      .createQueryBuilder('writer')
      .select('SUM(writer.balanceUSD)', 'total')
      .getRawOne();

    return {
      totalPaidAmount: parseFloat(stats.totalPaid) || 0,
      totalPendingPayments: parseFloat(stats.totalPending) || 0,
      totalPayableAmount: parseFloat(totalPayable.total) || 0,
    };
  }

  private async getRecentOrders(limit: number): Promise<any[]> {
    return this.orderRepository.find({
      relations: ['writer', 'writer.user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  private async getPendingSubmissions(limit: number): Promise<any[]> {
    return this.submissionRepository.find({
      where: { status: SubmissionStatus.PENDING },
      relations: ['writer', 'writer.user', 'order'],
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }

  private async getPendingPayments(limit: number): Promise<any[]> {
    return this.paymentRepository.find({
      where: { status: PaymentStatus.PENDING },
      relations: ['writer', 'writer.user'],
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }

  private async getWriterSubmissions(writerId: string): Promise<any[]> {
    return this.submissionRepository.find({
      where: { writerId },
      relations: ['order'],
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  private async getWriterPayments(writerId: string): Promise<any[]> {
    return this.paymentRepository.find({
      where: { writerId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  private async getWriterMonthlyEarnings(writerId: string, months: number): Promise<any[]> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const earnings = await this.submissionRepository
      .createQueryBuilder('submission')
      .select([
        'EXTRACT(YEAR FROM submission.createdAt) as year',
        'EXTRACT(MONTH FROM submission.createdAt) as month',
        'SUM(submission.amount) as earnings',
        'SUM(submission.pagesWorked) as pages',
      ])
      .where('submission.writerId = :writerId', { writerId })
      .andWhere('submission.status = :approved', { approved: SubmissionStatus.APPROVED })
      .andWhere('submission.createdAt >= :startDate', { startDate })
      .groupBy('EXTRACT(YEAR FROM submission.createdAt), EXTRACT(MONTH FROM submission.createdAt)')
      .orderBy('year, month', 'ASC')
      .getRawMany();

    return earnings.map(earning => ({
      year: parseInt(earning.year),
      month: parseInt(earning.month),
      earnings: parseFloat(earning.earnings) || 0,
      pages: parseInt(earning.pages) || 0,
    }));
  }
}