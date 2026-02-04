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
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
}

export enum PaymentMethod {
  BANK_TRANSFER = 'bank_transfer',
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
  amount: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
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

  @Column({ nullable: true, name: 'paid_by' })
  paidBy?: string; // Admin user ID

  @Column({ nullable: true, name: 'paid_at' })
  paidAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Writer)
  @JoinColumn({ name: 'writer_id' })
  writer: Writer;

  // Virtual properties
  get isPaid(): boolean {
    return this.status === PaymentStatus.PAID;
  }

  get isPending(): boolean {
    return this.status === PaymentStatus.PENDING;
  }
}
