import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { PaymentMethod, PaymentStatus } from './payment.entity';
import { numericTransformer } from '../common/transformers/numeric.transformer';

@Entity('payment_logs')
export class PaymentLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'payment_id', nullable: true })
  @Index()
  paymentId?: string;

  @Column({ name: 'transaction_id' })
  @Index()
  transactionId: string;

  @Column({ name: 'writer_id' })
  @Index()
  writerId: string;

  @Column({ type: 'simple-array', name: 'order_ids', nullable: true })
  orderIds?: string[];

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: numericTransformer,
  })
  amount: number;

  @Column({ length: 8, default: 'KSH' })
  currency: string;

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
    name: 'payment_method',
  })
  paymentMethod?: PaymentMethod;

  @Column({ name: 'processed_by', nullable: true })
  processedBy?: string;

  @Column({ name: 'processed_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  processedAt: Date;

  @Column({ name: 'notification_sent', default: false })
  notificationSent: boolean;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
