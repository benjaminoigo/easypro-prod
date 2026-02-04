import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Writer } from '../writers/writer.entity';

export enum UserRole {
  ADMIN = 'admin',
  WRITER = 'writer',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ nullable: true, type: 'varchar' })
  phone?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.WRITER,
  })
  role: UserRole;

  @Column({ default: false })
  isActive: boolean;

  @Column({ default: false })
  isApproved: boolean;

  @Column({ default: 0, name: 'token_version' })
  tokenVersion: number;

  @Column({ nullable: true, name: 'invite_token' })
  inviteToken?: string;

  @Column({ nullable: true, name: 'invite_token_expiry', type: 'timestamp' })
  inviteTokenExpiry?: Date;

  @Column({ nullable: true, name: 'invited_by' })
  invitedBy?: string;

  @Column({ nullable: true, name: 'reset_otp_hash', type: 'varchar' })
  resetOtpHash?: string | null;

  @Column({ nullable: true, name: 'reset_otp_expiry', type: 'timestamp' })
  resetOtpExpiry?: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => Writer, (writer) => writer.user)
  writerProfile?: Writer;

  // Virtual fields
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
