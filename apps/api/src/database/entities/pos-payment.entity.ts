import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { POSTransaction } from './pos-transaction.entity';

@Entity('pos_payments')
export class POSPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'transaction_id' })
  transactionId: string;

  @ManyToOne(() => POSTransaction, (tx) => tx.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'transaction_id' })
  transaction: POSTransaction;

  @Column({ length: 30 })
  method: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: string;

  @Column({ type: 'varchar', nullable: true, length: 100 })
  reference: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
