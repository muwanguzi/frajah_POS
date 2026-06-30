import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StockCountItem } from './stock-count-item.entity';

@Entity('stock_counts')
export class StockCount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'count_number', unique: true, length: 50 })
  countNumber: string;

  @Column({ name: 'branch_id' })
  branchId: string;

  @Column({ length: 30, default: 'DRAFT' })
  status: string;

  @Column({ type: 'varchar', name: 'counted_by_id', nullable: true })
  countedById: string | null;

  @Column({ nullable: true, type: 'text' })
  notes: string | null;

  @OneToMany(() => StockCountItem, (item) => item.stockCount, {
    cascade: true,
  })
  items: StockCountItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
