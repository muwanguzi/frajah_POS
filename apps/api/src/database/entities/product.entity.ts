import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from './category.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 250 })
  name: string;

  @Column({ unique: true, length: 100 })
  sku: string;

  @Column({ type: 'varchar', unique: true, nullable: true, length: 100 })
  barcode: string | null;

  @Column({ type: 'varchar', nullable: true, length: 150 })
  brand: string | null;

  @Column({ type: 'varchar', name: 'category_id', nullable: true })
  categoryId: string | null;

  @ManyToOne(() => Category, { nullable: true, eager: false })
  @JoinColumn({ name: 'category_id' })
  category: Category | null;

  @Column({ nullable: true, type: 'text' })
  description: string | null;

  @Column({ name: 'unit_of_measure', length: 30, default: 'piece' })
  unitOfMeasure: string;

  @Column({
    name: 'cost_price',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: '0',
  })
  costPrice: string;

  @Column({
    name: 'selling_price',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: '0',
  })
  sellingPrice: string;

  @Column({
    name: 'wholesale_price',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  wholesalePrice: string | null;

  @Column({
    name: 'min_selling_price',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  minSellingPrice: string | null;

  @Column({
    name: 'vat_rate',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: '0',
  })
  vatRate: string;

  @Column({ name: 'reorder_level', default: 0 })
  reorderLevel: number;

  @Column({ name: 'reorder_quantity', default: 0 })
  reorderQuantity: number;

  @Column({ type: 'numeric', name: 'max_stock', nullable: true })
  maxStock: number | null;

  @Column({ type: 'numeric', name: 'safety_stock', nullable: true })
  safetyStock: number | null;

  @Column({
    name: 'current_stock',
    type: 'decimal',
    precision: 15,
    scale: 3,
    default: '0',
  })
  currentStock: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_service', default: false })
  isService: boolean;

  @Column({ name: 'costing_method', length: 10, default: 'FIFO' })
  costingMethod: string;

  @Column({ name: 'serial_tracking', default: false })
  serialTracking: boolean;

  @Column({ name: 'batch_tracking', default: false })
  batchTracking: boolean;

  @Column({ type: 'int', name: 'warranty_period', nullable: true })
  warrantyPeriod: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
