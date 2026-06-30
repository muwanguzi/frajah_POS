import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Supplier } from './supplier.entity';
import { Branch } from './branch.entity';
import { PurchaseOrderItem } from './purchase-order-item.entity';

@Entity('purchase_orders')
export class PurchaseOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'po_number', unique: true, length: 50 })
  poNumber: string;

  @Column({ name: 'supplier_id' })
  supplierId: string;

  @ManyToOne(() => Supplier, { eager: false })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Column({ name: 'branch_id' })
  branchId: string;

  @ManyToOne(() => Branch, { eager: false })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ length: 30, default: 'DRAFT' })
  status: string;

  @Column({ name: 'order_date', type: 'date' })
  orderDate: string;

  @Column({ name: 'expected_date', type: 'date', nullable: true })
  expectedDate: string | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: '0' })
  subtotal: string;

  @Column({
    name: 'tax_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: '0',
  })
  taxAmount: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: '0' })
  total: string;

  @Column({ nullable: true, type: 'text' })
  notes: string | null;

  @Column({ type: 'varchar', name: 'created_by_id', nullable: true })
  createdById: string | null;

  @OneToMany(() => PurchaseOrderItem, (item) => item.purchaseOrder, {
    cascade: true,
  })
  items: PurchaseOrderItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
