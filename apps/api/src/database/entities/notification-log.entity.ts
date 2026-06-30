import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('notification_logs')
export class NotificationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', name: 'user_id', nullable: true })
  userId: string | null;

  @Column({ length: 20 })
  channel: string;

  @Column({ length: 255 })
  recipient: string;

  @Column({ type: 'varchar', nullable: true, length: 255 })
  subject: string | null;

  @Column({ type: 'text' })
  body: string;

  @Column({ length: 20, default: 'PENDING' })
  status: string;

  @Column({ name: 'error_message', nullable: true, type: 'text' })
  errorMessage: string | null;

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
