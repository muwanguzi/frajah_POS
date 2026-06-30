import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('suppliers')
export class Supplier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'varchar', name: 'contact_person', nullable: true, length: 200 })
  contactPerson: string | null;

  @Column({ type: 'varchar', nullable: true, length: 255 })
  email: string | null;

  @Column({ type: 'varchar', nullable: true, length: 20 })
  phone: string | null;

  @Column({ nullable: true, type: 'text' })
  address: string | null;

  @Column({ type: 'varchar', name: 'tin_number', nullable: true, length: 50 })
  tinNumber: string | null;

  @Column({ name: 'payment_terms_days', default: 30 })
  paymentTermsDays: number;

  @Column({
    name: 'credit_limit',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: '0',
  })
  creditLimit: string;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: '0',
  })
  balance: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
