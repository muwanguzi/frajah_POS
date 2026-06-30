import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { POSSession } from './pos-session.entity';
import { Customer } from './customer.entity';
import { POSTransactionItem } from './pos-transaction-item.entity';
import { POSPayment } from './pos-payment.entity';

@Entity('pos_transactions')
export class POSTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'receipt_number', unique: true, length: 50 })
  receiptNumber: string;

  @Column({ name: 'session_id' })
  sessionId: string;

  @ManyToOne(() => POSSession, { eager: false })
  @JoinColumn({ name: 'session_id' })
  session: POSSession;

  @Column({ type: 'varchar', name: 'customer_id', nullable: true })
  customerId: string | null;

  @ManyToOne(() => Customer, { nullable: true, eager: false })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: '0' })
  subtotal: string;

  @Column({
    name: 'discount_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: '0',
  })
  discountAmount: string;

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
    name: 'amount_tendered',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: '0',
  })
  amountTendered: string;

  @Column({
    name: 'change_given',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: '0',
  })
  changeGiven: string;

  @Column({ length: 20, default: 'COMPLETED' })
  status: string;

  @Column({ type: 'text', name: 'voided_reason', nullable: true })
  voidedReason: string | null;

  @Column({ type: 'timestamp', name: 'voided_at', nullable: true })
  voidedAt: Date | null;

  @OneToMany(() => POSTransactionItem, (item) => item.transaction, {
    cascade: true,
  })
  items: POSTransactionItem[];

  @OneToMany(() => POSPayment, (payment) => payment.transaction, {
    cascade: true,
  })
  payments: POSPayment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
