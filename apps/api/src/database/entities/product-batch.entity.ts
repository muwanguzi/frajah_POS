import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { Branch } from './branch.entity';

@Entity('product_batches')
export class ProductBatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'batch_number', unique: true, length: 100 })
  batchNumber: string;

  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne(() => Product, { eager: false })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'branch_id' })
  branchId: string;

  @ManyToOne(() => Branch, { eager: false })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ type: 'varchar', name: 'goods_receipt_item_id', nullable: true })
  goodsReceiptItemId: string | null;

  @Column({
    name: 'quantity_received',
    type: 'decimal',
    precision: 15,
    scale: 3,
  })
  quantityReceived: string;

  @Column({
    name: 'quantity_remaining',
    type: 'decimal',
    precision: 15,
    scale: 3,
  })
  quantityRemaining: string;

  @Column({ name: 'unit_cost', type: 'decimal', precision: 15, scale: 2 })
  unitCost: string;

  @Column({ name: 'costing_method', length: 10, default: 'FIFO' })
  costingMethod: string;

  @Column({ name: 'expiry_date', type: 'date', nullable: true })
  expiryDate: string | null;

  @Column({
    name: 'received_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  receivedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
