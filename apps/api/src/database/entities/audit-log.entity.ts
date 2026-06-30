import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', name: 'user_id', nullable: true })
  userId: string | null;

  @Column({ type: 'varchar', name: 'branch_id', nullable: true })
  branchId: string | null;

  @Column({ length: 100 })
  action: string;

  @Column({ name: 'entity_type', length: 100 })
  entityType: string;

  @Column({ name: 'entity_id', nullable: true, type: 'uuid' })
  entityId: string | null;

  @Column({ name: 'old_values', type: 'jsonb', nullable: true })
  oldValues: Record<string, unknown> | null;

  @Column({ name: 'new_values', type: 'jsonb', nullable: true })
  newValues: Record<string, unknown> | null;

  @Column({ type: 'varchar', name: 'ip_address', nullable: true, length: 45 })
  ipAddress: string | null;

  @Column({ name: 'user_agent', nullable: true, type: 'text' })
  userAgent: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
