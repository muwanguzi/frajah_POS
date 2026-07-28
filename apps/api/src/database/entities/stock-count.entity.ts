import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StockCountItem } from './stock-count-item.entity';
import { Branch } from './branch.entity';

@Entity('stock_counts')
export class StockCount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'count_number', unique: true, length: 50 })
  countNumber: string;

  @Column({ name: 'branch_id' })
  branchId: string;

  @ManyToOne(() => Branch, { nullable: true, eager: false })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ length: 30, default: 'IN_PROGRESS' })
  status: string;

  @Column({ type: 'varchar', name: 'counted_by_id', nullable: true })
  countedById: string | null;

  @Column({ nullable: true, type: 'text' })
  notes: string | null;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @OneToMany(() => StockCountItem, (item) => item.stockCount, {
    cascade: true,
  })
  items: StockCountItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
