import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Writer } from '../writers/writer.entity';
import { numericTransformer } from '../common/transformers/numeric.transformer';

export enum PaymentStatus {
  PENDING = 'pending', // legacy alias for payment pending
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  PAYMENT_PENDING = 'payment_pending',
  PAID = 'paid',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  BANK_TRANSFER = 'bank_transfer',
  MPESA = 'mpesa',
  PAYPAL = 'paypal',
  CHECK = 'check',
  OTHER = 'other',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'writer_id' })
  @Index()
  writerId: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: numericTransformer,
  })
  amount: number; // Net amount after adjustments

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PAYMENT_PENDING,
  })
  status: PaymentStatus;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    nullable: true,
  })
  method?: PaymentMethod;

  @Column({ nullable: true, name: 'transaction_reference' })
  transactionReference?: string;

  @Column({ nullable: true, type: 'text' })
  notes?: string;

  @Column({ default: 'KSH' })
  currency: string;

  @Column({ type: 'simple-array', name: 'order_ids', nullable: true })
  orderIds?: string[];

  @Column({
    type: 'decimal',
    precision: 6,
    scale: 1,
    nullable: true,
    name: 'approved_pages',
    transformer: numericTransformer,
  })
  approvedPages?: number;

  @Column({
    type: 'decimal',
    precision: 8,
    scale: 2,
    nullable: true,
    name: 'base_rate',
    transformer: numericTransformer,
  })
  baseRate?: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'gross_amount',
    transformer: numericTransformer,
  })
  grossAmount?: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    name: 'bonus_amount',
    transformer: numericTransformer,
  })
  bonusAmount: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    name: 'deduction_amount',
    transformer: numericTransformer,
  })
  deductionAmount: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    name: 'platform_fee',
    transformer: numericTransformer,
  })
  platformFee: number;

  @Column({ name: 'payment_period_start', type: 'timestamp', nullable: true })
  paymentPeriodStart?: Date;

  @Column({ name: 'payment_period_end', type: 'timestamp', nullable: true })
  paymentPeriodEnd?: Date;

  @Column({ nullable: true, name: 'paid_by' })
  paidBy?: string; // Admin user ID

  @Column({ nullable: true, name: 'paid_at' })
  paidAt?: Date;

  @Column({ nullable: true, name: 'processed_at' })
  processedAt?: Date;

  @Column({ default: false, name: 'notification_sent' })
  notificationSent: boolean;

  @Column({ nullable: true, name: 'notification_sent_at' })
  notificationSentAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Writer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'writer_id' })
  writer: Writer;

  // Virtual properties
  get isPaid(): boolean {
    return this.status === PaymentStatus.PAID;
  }

  get isPending(): boolean {
    return (
      this.status === PaymentStatus.PAYMENT_PENDING ||
      this.status === PaymentStatus.APPROVED ||
      this.status === PaymentStatus.PENDING_APPROVAL
    );
  }
}
