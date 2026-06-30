import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { GoodsReceipt } from './goods-receipt.entity';
import { Product } from './product.entity';

@Entity('goods_receipt_items')
export class GoodsReceiptItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'goods_receipt_id' })
  goodsReceiptId: string;

  @ManyToOne(() => GoodsReceipt, (gr) => gr.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'goods_receipt_id' })
  goodsReceipt: GoodsReceipt;

  @Column({ type: 'varchar', name: 'purchase_order_item_id', nullable: true })
  purchaseOrderItemId: string | null;

  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne(() => Product, { eager: false })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({
    name: 'quantity_received',
    type: 'decimal',
    precision: 15,
    scale: 3,
  })
  quantityReceived: string;

  @Column({
    name: 'quantity_damaged',
    type: 'decimal',
    precision: 15,
    scale: 3,
    default: '0',
  })
  quantityDamaged: string;

  @Column({ type: 'varchar', name: 'batch_id', nullable: true })
  batchId: string | null;
}
