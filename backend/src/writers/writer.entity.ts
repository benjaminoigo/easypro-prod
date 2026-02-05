import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  OneToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Order } from '../orders/order.entity';
import { Submission } from '../submissions/submission.entity';
import { WriterStatusLog } from './writer-status-log.entity';
import { numericTransformer } from '../common/transformers/numeric.transformer';

export enum WriterStatus {
  ACTIVE = 'active',
  PROBATION = 'probation',
  SUSPENDED = 'suspended',
}

@Entity('writers')
export class Writer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({
    type: 'enum',
    enum: WriterStatus,
    default: WriterStatus.ACTIVE,
  })
  status: WriterStatus;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    name: 'balance_usd',
    transformer: numericTransformer,
  })
  balanceUSD: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    name: 'lifetime_earnings',
    transformer: numericTransformer,
  })
  lifetimeEarnings: number;

  @Column({ default: 0, name: 'total_orders_completed' })
  totalOrdersCompleted: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    name: 'total_pages_completed',
    transformer: numericTransformer,
  })
  totalPagesCompleted: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    name: 'current_shift_pages',
    transformer: numericTransformer,
  })
  currentShiftPages: number;

  @Column({ default: 0, name: 'current_shift_orders' })
  currentShiftOrders: number;

  @Column({ nullable: true, name: 'last_submission_date' })
  lastSubmissionDate?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Order, (order) => order.writer)
  orders?: Order[];

  @OneToMany(() => Submission, (submission) => submission.writer)
  submissions?: Submission[];

  @OneToMany(() => WriterStatusLog, (log) => log.writer)
  statusLogs?: WriterStatusLog[];
}
