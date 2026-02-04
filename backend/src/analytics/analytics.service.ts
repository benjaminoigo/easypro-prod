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
      weeklyOrders,
      orderStatusDistribution,
      onlineWriters,
      growthRate,
    ] = await Promise.all([
      this.getTotalUsers(),
      this.getTotalWriters(),
      this.getOrderStats(),
      this.getSubmissionStats(),
      this.getPaymentStats(),
      this.getRecentOrders(5),
      this.getPendingSubmissions(5),
      this.getPendingPayments(5),
      this.getWeeklyOrders(),
      this.getOrderStatusDistribution(),
      this.getOnlineWriters(),
      this.getGrowthRate(),
    ]);

    return {
      overview: {
        totalUsers,
        totalWriters,
        onlineWriters,
        growthRate,
        ...orderStats,
        ...submissionStats,
        ...paymentStats,
      },
      recentActivity: {
        recentOrders,
        pendingSubmissions,
        pendingPayments,
      },
      charts: {
        weeklyOrders,
        orderStatusDistribution,
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
      currentShiftPages: parseFloat(earning.currentShiftPages) || 0,
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
      pages: parseFloat(submission.totalPages) || 0,
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
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats = await this.orderRepository
      .createQueryBuilder('order')
      .select([
        'COUNT(*) as totalOrders',
        'COUNT(CASE WHEN status = :completed THEN 1 END) as completedOrders',
        'COUNT(CASE WHEN status IN (:...activeStatuses) THEN 1 END) as activeOrders',
        'SUM(CASE WHEN status = :completed THEN "totalAmount" ELSE 0 END) as totalRevenue',
        'COUNT(CASE WHEN status = :completed AND created_at >= :thisMonthStart THEN 1 END) as completedThisMonth',
      ])
      .setParameter('completed', OrderStatus.SUBMITTED)
      .setParameter('activeStatuses', [OrderStatus.ASSIGNED, OrderStatus.IN_PROGRESS])
      .setParameter('thisMonthStart', thisMonthStart)
      .getRawOne();

    return {
      totalOrders: parseInt(stats.totalOrders || '0'),
      completedOrders: parseInt(stats.completedOrders || '0'),
      activeOrders: parseInt(stats.activeOrders || '0'),
      totalRevenue: parseFloat(stats.totalRevenue) || 0,
      completedThisMonth: parseInt(stats.completedThisMonth || '0'),
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
      totalApprovedPages: parseFloat(stats.totalPages) || 0,
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
      pages: parseFloat(earning.pages) || 0,
    }));
  }

  private async getWeeklyOrders(): Promise<any[]> {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start from Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    const orders = await this.orderRepository
      .createQueryBuilder('order')
      .select([
        'EXTRACT(DOW FROM created_at) as dayOfWeek',
        'COUNT(*) as count',
      ])
      .where('created_at >= :startOfWeek', { startOfWeek })
      .groupBy('EXTRACT(DOW FROM created_at)')
      .getRawMany();

    // Create a map for quick lookup
    const orderMap = new Map<number, number>();
    orders.forEach(o => {
      orderMap.set(parseInt(o.dayofweek), parseInt(o.count));
    });

    // Return data for Mon-Sun (reorder from Sun start)
    return [1, 2, 3, 4, 5, 6, 0].map(dayNum => ({
      day: days[dayNum],
      orders: orderMap.get(dayNum) || 0,
    }));
  }

  private async getOrderStatusDistribution(): Promise<any[]> {
    const stats = await this.orderRepository
      .createQueryBuilder('order')
      .select([
        'order.status as status',
        'COUNT(*) as count',
      ])
      .groupBy('order.status')
      .getRawMany();

    const statusColors: Record<string, string> = {
      [OrderStatus.SUBMITTED]: '#10B981', // Completed - Green
      [OrderStatus.IN_PROGRESS]: '#3B82F6', // In Progress - Blue
      [OrderStatus.ASSIGNED]: '#F59E0B', // Assigned - Yellow
      [OrderStatus.CANCELLED]: '#EF4444', // Cancelled - Red
    };

    const statusLabels: Record<string, string> = {
      [OrderStatus.SUBMITTED]: 'Completed',
      [OrderStatus.IN_PROGRESS]: 'In Progress',
      [OrderStatus.ASSIGNED]: 'Assigned',
      [OrderStatus.CANCELLED]: 'Cancelled',
    };

    return stats.map(s => ({
      name: statusLabels[s.status] || s.status,
      value: parseInt(s.count),
      color: statusColors[s.status] || '#94A3B8',
    }));
  }

  private async getOnlineWriters(): Promise<number> {
    // Count writers who have submitted work today (considered active/online)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const count = await this.submissionRepository
      .createQueryBuilder('submission')
      .select('COUNT(DISTINCT submission.writer_id)', 'count')
      .where('submission.created_at >= :today', { today })
      .getRawOne();

    return parseInt(count?.count) || 0;
  }

  private async getGrowthRate(): Promise<number> {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const [thisMonthRevenue, lastMonthRevenue] = await Promise.all([
      this.orderRepository
        .createQueryBuilder('order')
        .select('SUM("totalAmount")', 'total')
        .where('status = :status', { status: OrderStatus.SUBMITTED })
        .andWhere('created_at >= :start', { start: thisMonthStart })
        .getRawOne(),
      this.orderRepository
        .createQueryBuilder('order')
        .select('SUM("totalAmount")', 'total')
        .where('status = :status', { status: OrderStatus.SUBMITTED })
        .andWhere('created_at >= :start', { start: lastMonthStart })
        .andWhere('created_at <= :end', { end: lastMonthEnd })
        .getRawOne(),
    ]);

    const thisMonth = parseFloat(thisMonthRevenue?.total) || 0;
    const lastMonth = parseFloat(lastMonthRevenue?.total) || 0;

    if (lastMonth === 0) return thisMonth > 0 ? 100 : 0;
    return Math.round(((thisMonth - lastMonth) / lastMonth) * 100 * 10) / 10;
  }
}
