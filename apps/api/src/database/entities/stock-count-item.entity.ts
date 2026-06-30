import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StockCount } from './stock-count.entity';

@Entity('stock_count_items')
export class StockCountItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'stock_count_id' })
  stockCountId: string;

  @ManyToOne(() => StockCount, (sc) => sc.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'stock_count_id' })
  stockCount: StockCount;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({
    name: 'system_quantity',
    type: 'decimal',
    precision: 15,
    scale: 3,
    default: '0',
  })
  systemQuantity: string;

  @Column({
    name: 'counted_quantity',
    type: 'decimal',
    precision: 15,
    scale: 3,
    default: '0',
  })
  countedQuantity: string;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 3,
    default: '0',
  })
  variance: string;
}
