import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('quotes')
export class Quote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'quote_number', unique: true, length: 50 })
  quoteNumber: string;

  @Column({ type: 'varchar', name: 'customer_id', nullable: true })
  customerId: string | null;

  @Column({ name: 'valid_until', type: 'date', nullable: true })
  validUntil: string | null;

  @Column({ length: 30, default: 'DRAFT' })
  status: string;

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

  @Column({ type: 'varchar', name: 'created_by_id', nullable: true })
  createdById: string | null;

  @Column({ type: 'jsonb', nullable: true })
  items: Record<string, unknown>[] | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
