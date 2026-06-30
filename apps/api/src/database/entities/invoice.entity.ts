import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'invoice_number', unique: true, length: 50 })
  invoiceNumber: string;

  @Column({ type: 'varchar', name: 'order_id', nullable: true })
  orderId: string | null;

  @Column({ type: 'varchar', name: 'customer_id', nullable: true })
  customerId: string | null;

  @Column({ name: 'branch_id' })
  branchId: string;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate: string | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: '0' })
  subtotal: string;

  @Column({
    name: 'tax_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: '0',
  })
  taxAmount: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: '0' })
  total: string;

  @Column({
    name: 'amount_paid',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: '0',
  })
  amountPaid: string;

  @Column({ length: 30, default: 'DRAFT' })
  status: string;

  @Column({ type: 'varchar', name: 'created_by_id', nullable: true })
  createdById: string | null;

  @Column({ type: 'jsonb', nullable: true })
  items: Record<string, unknown>[] | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
