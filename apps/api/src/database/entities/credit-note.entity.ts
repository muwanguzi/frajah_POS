import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('credit_notes')
export class CreditNote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cn_number', unique: true, length: 50 })
  cnNumber: string;

  @Column({ type: 'varchar', name: 'invoice_id', nullable: true })
  invoiceId: string | null;

  @Column({ type: 'varchar', name: 'customer_id', nullable: true })
  customerId: string | null;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: string;

  @Column({ length: 30, default: 'PENDING' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
