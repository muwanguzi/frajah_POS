import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { Product } from './product.entity';
import { Branch } from './branch.entity';

@Entity('stock_levels')
@Unique(['productId', 'branchId'])
export class StockLevel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne(() => Product, { eager: false })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'branch_id' })
  branchId: string;

  @ManyToOne(() => Branch, { eager: false })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({
    name: 'quantity_on_hand',
    type: 'decimal',
    precision: 15,
    scale: 3,
    default: '0',
  })
  quantityOnHand: string;

  @Column({
    name: 'quantity_reserved',
    type: 'decimal',
    precision: 15,
    scale: 3,
    default: '0',
  })
  quantityReserved: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
