import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'varchar', nullable: true, length: 255 })
  email: string | null;

  @Column({ type: 'varchar', nullable: true, length: 20 })
  phone: string | null;

  @Column({ nullable: true, type: 'text' })
  address: string | null;

  @Column({ type: 'varchar', name: 'tin_number', nullable: true, length: 50 })
  tinNumber: string | null;

  @Column({
    name: 'credit_limit',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: '0',
  })
  creditLimit: string;

  @Column({
    name: 'credit_balance',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: '0',
  })
  creditBalance: string;

  @Column({ name: 'loyalty_points', type: 'int', default: 0 })
  loyaltyPoints: number;

  @Column({ name: 'customer_type', length: 30, default: 'RETAIL' })
  customerType: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
