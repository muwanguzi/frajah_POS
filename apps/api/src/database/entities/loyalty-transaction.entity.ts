import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Customer } from './customer.entity';

@Entity('loyalty_transactions')
export class LoyaltyTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @ManyToOne(() => Customer, { eager: false })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ type: 'int' })
  points: number;

  @Column({ length: 150 })
  reason: string;

  @Column({ name: 'reference_id', nullable: true, type: 'uuid' })
  referenceId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
