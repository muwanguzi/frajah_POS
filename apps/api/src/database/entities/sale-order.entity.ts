import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SaleOrderItem } from './sale-order-item.entity';

@Entity('sale_orders')
export class SaleOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_number', unique: true, length: 50 })
  orderNumber: string;

  @Column({ type: 'varchar', name: 'customer_id', nullable: true })
  customerId: string | null;

  @Column({ name: 'branch_id' })
  branchId: string;

  @Column({ length: 30, default: 'PENDING' })
  status: string;

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

  @Column({ nullable: true, type: 'text' })
  notes: string | null;

  @Column({ type: 'varchar', name: 'created_by_id', nullable: true })
  createdById: string | null;

  @OneToMany(() => SaleOrderItem, (item) => item.order, { cascade: true })
  items: SaleOrderItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
