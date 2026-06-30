import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { PurchaseOrder } from './purchase-order.entity';
import { GoodsReceiptItem } from './goods-receipt-item.entity';

@Entity('goods_receipts')
export class GoodsReceipt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'grn_number', unique: true, length: 50 })
  grnNumber: string;

  @Column({ name: 'purchase_order_id' })
  purchaseOrderId: string;

  @ManyToOne(() => PurchaseOrder, { eager: false })
  @JoinColumn({ name: 'purchase_order_id' })
  purchaseOrder: PurchaseOrder;

  @Column({ name: 'branch_id' })
  branchId: string;

  @Column({ type: 'varchar', name: 'received_by_id', nullable: true })
  receivedById: string | null;

  @Column({ name: 'received_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  receivedAt: Date;

  @Column({ nullable: true, type: 'text' })
  notes: string | null;

  @OneToMany(() => GoodsReceiptItem, (item) => item.goodsReceipt, {
    cascade: true,
  })
  items: GoodsReceiptItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
