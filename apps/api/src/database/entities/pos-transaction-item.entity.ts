import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { POSTransaction } from './pos-transaction.entity';
import { Product } from './product.entity';

@Entity('pos_transaction_items')
export class POSTransactionItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'transaction_id' })
  transactionId: string;

  @ManyToOne(() => POSTransaction, (tx) => tx.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'transaction_id' })
  transaction: POSTransaction;

  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne(() => Product, { eager: false })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'decimal', precision: 15, scale: 3 })
  quantity: string;

  @Column({ name: 'unit_price', type: 'decimal', precision: 15, scale: 2 })
  unitPrice: string;

  @Column({
    name: 'discount_percent',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: '0',
  })
  discountPercent: string;

  @Column({ name: 'line_total', type: 'decimal', precision: 15, scale: 2 })
  lineTotal: string;

  @Column({ type: 'varchar', name: 'batch_id', nullable: true })
  batchId: string | null;

  @Column({ type: 'jsonb', name: 'batch_breakdown', nullable: true })
  batchBreakdown: Array<{ batchId: string; quantity: number; unitCost: number }> | null;
}
