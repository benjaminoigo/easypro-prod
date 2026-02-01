import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('shifts')
export class Shift {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'start_time' })
  @Index()
  startTime: Date;

  @Column({ name: 'end_time' })
  endTime: Date;

  @Column({ default: 20, name: 'max_pages_per_shift' })
  maxPagesPerShift: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Helper methods
  isCurrentShift(): boolean {
    const now = new Date();
    return now >= this.startTime && now <= this.endTime;
  }

  getShiftDate(): string {
    return this.startTime.toISOString().split('T')[0];
  }
}