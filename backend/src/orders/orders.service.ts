import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { Order, OrderStatus, CancellationConsequence } from './order.entity';
import { Writer, WriterStatus } from '../writers/writer.entity';
import { WriterStatusLog, StatusAction } from '../writers/writer-status-log.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Writer)
    private readonly writerRepository: Repository<Writer>,
    @InjectRepository(WriterStatusLog)
    private readonly statusLogRepository: Repository<WriterStatusLog>,
  ) {}

  async create(createOrderDto: CreateOrderDto, files?: Express.Multer.File[]): Promise<Order> {
    // Use provided order number or generate a unique one
    const orderNumber = createOrderDto.orderNumber || await this.generateOrderNumber();
    
    // Calculate total amount
    const totalAmount = createOrderDto.pages * createOrderDto.cpp;

    // Set status based on whether a writer is assigned
    const status = createOrderDto.writerId ? OrderStatus.ASSIGNED : OrderStatus.ASSIGNED;

    // Handle multiple file uploads
    const attachmentPaths = files?.map(f => f.path) || [];
    const attachmentNames = files?.map(f => f.originalname) || [];

    const order = this.orderRepository.create({
      ...createOrderDto,
      orderNumber,
      totalAmount,
      status,
      attachmentPaths,
      attachmentNames,
    });

    return this.orderRepository.save(order);
  }

  async findAll(options?: FindManyOptions<Order>): Promise<Order[]> {
    return this.orderRepository.find({
      relations: ['writer', 'writer.user'],
      order: { createdAt: 'DESC' },
      ...options,
    });
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['writer', 'writer.user', 'submissions'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async findByOrderNumber(orderNumber: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { orderNumber },
      relations: ['writer', 'writer.user', 'submissions'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async findByWriter(writerId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { writerId },
      relations: ['submissions'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);

    // Recalculate total amount if pages or cpp changed
    if (updateOrderDto.pages || updateOrderDto.cpp) {
      const pages = updateOrderDto.pages || order.pages;
      const cpp = updateOrderDto.cpp || order.cpp;
      updateOrderDto.totalAmount = pages * cpp;
    }

    Object.assign(order, updateOrderDto);
    return this.orderRepository.save(order);
  }

  async assignToWriter(id: string, writerId: string): Promise<Order> {
    const order = await this.findOne(id);
    const writer = await this.writerRepository.findOne({
      where: { id: writerId },
      relations: ['user'],
    });

    if (!writer) {
      throw new NotFoundException('Writer not found');
    }

    if (writer.status !== WriterStatus.ACTIVE && writer.status !== WriterStatus.PROBATION) {
      throw new BadRequestException('Cannot assign orders to suspended writers');
    }

    order.writerId = writerId;
    order.status = OrderStatus.ASSIGNED;

    return this.orderRepository.save(order);
  }

  async markInProgress(id: string): Promise<Order> {
    const order = await this.findOne(id);
    
    if (order.status !== OrderStatus.ASSIGNED) {
      throw new BadRequestException('Order must be assigned to mark as in progress');
    }

    order.status = OrderStatus.IN_PROGRESS;
    return this.orderRepository.save(order);
  }

  async markSubmitted(id: string): Promise<Order> {
    const order = await this.findOne(id);
    
    if (order.status !== OrderStatus.IN_PROGRESS) {
      throw new BadRequestException('Order must be in progress to mark as submitted');
    }

    order.status = OrderStatus.SUBMITTED;
    return this.orderRepository.save(order);
  }

  async cancelOrder(id: string, cancelDto: CancelOrderDto, adminUserId: string): Promise<Order> {
    const order = await this.findOne(id);

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Order is already cancelled');
    }

    if (order.status === OrderStatus.SUBMITTED) {
      throw new BadRequestException('Cannot cancel submitted orders');
    }

    // Update order
    order.status = OrderStatus.CANCELLED;
    order.cancellationReason = cancelDto.reason;
    order.cancellationConsequence = cancelDto.consequence;
    order.cancelledBy = adminUserId;
    order.cancelledAt = new Date();

    const savedOrder = await this.orderRepository.save(order);

    // Apply consequence to writer if order was assigned
    if (order.writerId && cancelDto.consequence !== CancellationConsequence.WARNING) {
      await this.applyWriterConsequence(order.writerId, cancelDto.consequence, cancelDto.reason, adminUserId);
    }

    return savedOrder;
  }

  async remove(id: string): Promise<void> {
    const order = await this.findOne(id);
    await this.orderRepository.remove(order);
  }

  async getOrderStats(): Promise<any> {
    const stats = await this.orderRepository
      .createQueryBuilder('order')
      .select([
        'COUNT(*) as total',
        'COUNT(CASE WHEN status = :assigned THEN 1 END) as assigned',
        'COUNT(CASE WHEN status = :inProgress THEN 1 END) as inProgress',
        'COUNT(CASE WHEN status = :submitted THEN 1 END) as submitted',
        'COUNT(CASE WHEN status = :cancelled THEN 1 END) as cancelled',
        'SUM(CASE WHEN status = :submitted THEN total_amount ELSE 0 END) as totalCompleted',
      ])
      .setParameters({
        assigned: OrderStatus.ASSIGNED,
        inProgress: OrderStatus.IN_PROGRESS,
        submitted: OrderStatus.SUBMITTED,
        cancelled: OrderStatus.CANCELLED,
      })
      .getRawOne();

    return {
      total: parseInt(stats.total),
      assigned: parseInt(stats.assigned),
      inProgress: parseInt(stats.inProgress),
      submitted: parseInt(stats.submitted),
      cancelled: parseInt(stats.cancelled),
      totalCompletedAmount: parseFloat(stats.totalCompleted) || 0,
    };
  }

  private async generateOrderNumber(): Promise<string> {
    const today = new Date();
    const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    const lastOrder = await this.orderRepository
      .createQueryBuilder('order')
      .where('order.orderNumber LIKE :prefix', { prefix: `${datePrefix}%` })
      .orderBy('order.orderNumber', 'DESC')
      .getOne();

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.slice(-3));
      sequence = lastSequence + 1;
    }

    return `${datePrefix}${sequence.toString().padStart(3, '0')}`;
  }

  private async applyWriterConsequence(
    writerId: string,
    consequence: CancellationConsequence,
    reason: string,
    adminUserId: string,
  ): Promise<void> {
    const writer = await this.writerRepository.findOne({
      where: { id: writerId },
    });

    if (!writer) return;

    let newStatus: WriterStatus;
    let action: StatusAction;
    let durationDays: number | undefined;

    switch (consequence) {
      case CancellationConsequence.PROBATION:
        newStatus = WriterStatus.PROBATION;
        action = StatusAction.PROBATION;
        durationDays = 7; // Default probation period
        break;
      case CancellationConsequence.SUSPENSION:
        newStatus = WriterStatus.SUSPENDED;
        action = StatusAction.SUSPENSION;
        durationDays = 30; // Default suspension period
        break;
      default:
        return; // No status change for warnings
    }

    const previousStatus = writer.status;
    writer.status = newStatus;
    await this.writerRepository.save(writer);

    // Log the status change
    const statusLog = this.statusLogRepository.create({
      writerId,
      previousStatus,
      newStatus,
      action,
      reason: `Order cancellation: ${reason}`,
      performedBy: adminUserId,
      durationDays,
      expiresAt: durationDays
        ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
        : undefined,
    });

    await this.statusLogRepository.save(statusLog);
  }
}
