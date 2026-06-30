import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PurchaseOrder } from './purchase-order.entity';
import { Product } from './product.entity';

@Entity('purchase_order_items')
export class PurchaseOrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'purchase_order_id' })
  purchaseOrderId: string;

  @ManyToOne(() => PurchaseOrder, (po) => po.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchase_order_id' })
  purchaseOrder: PurchaseOrder;

  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne(() => Product, { eager: false })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({
    name: 'quantity_ordered',
    type: 'decimal',
    precision: 15,
    scale: 3,
  })
  quantityOrdered: string;

  @Column({
    name: 'quantity_received',
    type: 'decimal',
    precision: 15,
    scale: 3,
    default: '0',
  })
  quantityReceived: string;

  @Column({ name: 'unit_cost', type: 'decimal', precision: 15, scale: 2 })
  unitCost: string;

  @Column({ name: 'line_total', type: 'decimal', precision: 15, scale: 2 })
  lineTotal: string;
}
