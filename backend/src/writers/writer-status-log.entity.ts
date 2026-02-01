import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Writer, WriterStatus } from './writer.entity';

export enum StatusAction {
  WARNING = 'warning',
  PROBATION = 'probation',
  SUSPENSION = 'suspension',
  ACTIVATION = 'activation',
}

@Entity('writer_status_logs')
export class WriterStatusLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'writer_id' })
  @Index()
  writerId: string;

  @Column({ name: 'previous_status', nullable: true })
  previousStatus?: WriterStatus;

  @Column({ name: 'new_status' })
  newStatus: WriterStatus;

  @Column({
    type: 'enum',
    enum: StatusAction,
  })
  action: StatusAction;

  @Column({ type: 'text' })
  reason: string;

  @Column({ name: 'performed_by' })
  performedBy: string; // Admin user ID

  @Column({ nullable: true, name: 'duration_days' })
  durationDays?: number; // For suspensions/probations

  @Column({ nullable: true, name: 'expires_at' })
  expiresAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Writer, (writer) => writer.statusLogs)
  @JoinColumn({ name: 'writer_id' })
  writer: Writer;
}