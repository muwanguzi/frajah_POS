import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('stock_adjustments')
export class StockAdjustment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'adjustment_number', unique: true, length: 50 })
  adjustmentNumber: string;

  @Column({ name: 'branch_id' })
  branchId: string;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ length: 30 })
  type: string;

  @Column({ type: 'decimal', precision: 15, scale: 3 })
  quantity: string;

  @Column({
    name: 'unit_cost',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  unitCost: string | null;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'varchar', name: 'adjusted_by_id', nullable: true })
  adjustedById: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
