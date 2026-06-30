import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StockTransferItem } from './stock-transfer-item.entity';

@Entity('stock_transfers')
export class StockTransfer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'transfer_number', unique: true, length: 50 })
  transferNumber: string;

  @Column({ name: 'from_branch_id' })
  fromBranchId: string;

  @Column({ name: 'to_branch_id' })
  toBranchId: string;

  @Column({ length: 30, default: 'PENDING' })
  status: string;

  @Column({ nullable: true, type: 'text' })
  notes: string | null;

  @Column({ type: 'varchar', name: 'initiated_by_id', nullable: true })
  initiatedById: string | null;

  @Column({ type: 'varchar', name: 'received_by_id', nullable: true })
  receivedById: string | null;

  @OneToMany(() => StockTransferItem, (item) => item.transfer, {
    cascade: true,
  })
  items: StockTransferItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
