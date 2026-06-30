import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SaleOrder } from './sale-order.entity';

@Entity('sale_order_items')
export class SaleOrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @ManyToOne(() => SaleOrder, (o) => o.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: SaleOrder;

  @Column({ name: 'product_id' })
  productId: string;

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
}
