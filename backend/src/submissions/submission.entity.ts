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
import { Order } from '../orders/order.entity';

export enum SubmissionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('submissions')
export class Submission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id' })
  @Index()
  orderId: string;

  @Column({ name: 'writer_id' })
  @Index()
  writerId: string;

  @Column({ type: 'decimal', precision: 5, scale: 1, name: 'pages_worked', default: 1 })
  pagesWorked: number;

  @Column({
    type: 'decimal',
    precision: 8,
    scale: 2,
  })
  cpp: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  amount: number;

  @Column({ nullable: true, name: 'file_path' })
  filePath?: string;

  @Column({ nullable: true, name: 'file_name' })
  fileName?: string;

  @Column({ type: 'simple-array', nullable: true, name: 'file_paths' })
  filePaths?: string[];

  @Column({ type: 'simple-array', nullable: true, name: 'file_names' })
  fileNames?: string[];

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({
    type: 'enum',
    enum: SubmissionStatus,
    default: SubmissionStatus.PENDING,
  })
  status: SubmissionStatus;

  @Column({ nullable: true, name: 'reviewed_by' })
  reviewedBy?: string; // Admin user ID

  @Column({ nullable: true, name: 'review_notes' })
  reviewNotes?: string;

  @Column({ nullable: true, name: 'reviewed_at' })
  reviewedAt?: Date;

  @Column({ name: 'shift_id' })
  @Index()
  shiftId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Order, (order) => order.submissions)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => Writer, (writer) => writer.submissions)
  @JoinColumn({ name: 'writer_id' })
  writer: Writer;

  // Virtual properties
  get isApproved(): boolean {
    return this.status === SubmissionStatus.APPROVED;
  }

  get isPending(): boolean {
    return this.status === SubmissionStatus.PENDING;
  }
}