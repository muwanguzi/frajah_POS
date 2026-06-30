import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StockTransfer } from './stock-transfer.entity';

@Entity('stock_transfer_items')
export class StockTransferItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'transfer_id' })
  transferId: string;

  @ManyToOne(() => StockTransfer, (t) => t.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'transfer_id' })
  transfer: StockTransfer;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ name: 'quantity_sent', type: 'decimal', precision: 15, scale: 3 })
  quantitySent: string;

  @Column({
    name: 'quantity_received',
    type: 'decimal',
    precision: 15,
    scale: 3,
    nullable: true,
  })
  quantityReceived: string | null;
}
