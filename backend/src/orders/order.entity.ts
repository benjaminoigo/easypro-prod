import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Writer } from '../writers/writer.entity';
import { Submission } from '../submissions/submission.entity';

export enum OrderStatus {
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
  CANCELLED = 'cancelled',
}

export enum CancellationConsequence {
  WARNING = 'warning',
  PROBATION = 'probation',
  SUSPENSION = 'suspension',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, name: 'order_number' })
  @Index()
  orderNumber: string;

  @Column()
  subject: string;

  @Column()
  deadline: Date;

  @Column({ type: 'int' })
  pages: number;

  @Column({
    type: 'decimal',
    precision: 8,
    scale: 2,
    comment: 'Cost per page in USD',
  })
  cpp: number; // Cost per page

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    comment: 'Total amount (pages × CPP)',
  })
  totalAmount: number;

  @Column({ name: 'writer_id', nullable: true })
  @Index()
  writerId?: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.ASSIGNED,
  })
  status: OrderStatus;

  @Column({ nullable: true, name: 'cancellation_reason' })
  cancellationReason?: string;

  @Column({
    type: 'enum',
    enum: CancellationConsequence,
    nullable: true,
    name: 'cancellation_consequence',
  })
  cancellationConsequence?: CancellationConsequence;

  @Column({ nullable: true, name: 'cancelled_by' })
  cancelledBy?: string; // Admin user ID

  @Column({ nullable: true, name: 'cancelled_at' })
  cancelledAt?: Date;

  @Column({ nullable: true, name: 'instructions', type: 'text' })
  instructions?: string;

  // Multiple file support for order attachments
  @Column('simple-array', { nullable: true, name: 'attachment_paths' })
  attachmentPaths?: string[];

  @Column('simple-array', { nullable: true, name: 'attachment_names' })
  attachmentNames?: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Writer, (writer) => writer.orders, { nullable: true })
  @JoinColumn({ name: 'writer_id' })
  writer?: Writer;

  @OneToMany(() => Submission, (submission) => submission.order)
  submissions?: Submission[];

  // Virtual properties
  get isOverdue(): boolean {
    return new Date() > this.deadline && this.status !== OrderStatus.SUBMITTED;
  }

  get daysToDue(): number {
    const now = new Date();
    const timeDiff = this.deadline.getTime() - now.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }
}