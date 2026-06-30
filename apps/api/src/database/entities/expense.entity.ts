import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ExpenseCategory } from './expense-category.entity';
import { User } from './user.entity';

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'expense_number', unique: true, length: 50 })
  expenseNumber: string;

  @Column({ name: 'branch_id' })
  branchId: string;

  @Column({ type: 'varchar', name: 'category_id', nullable: true })
  categoryId: string | null;

  @ManyToOne(() => ExpenseCategory, { nullable: true, eager: false })
  @JoinColumn({ name: 'category_id' })
  category: ExpenseCategory | null;

  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'submitted_by_id' })
  submittedBy: User | null;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'expense_date', type: 'date' })
  expenseDate: string;

  @Column({ type: 'varchar', name: 'receipt_url', nullable: true, length: 500 })
  receiptUrl: string | null;

  @Column({ length: 30, default: 'DRAFT' })
  status: string;

  @Column({ type: 'text', name: 'rejection_reason', nullable: true })
  rejectionReason: string | null;

  @Column({ type: 'varchar', name: 'submitted_by_id', nullable: true })
  submittedById: string | null;

  @Column({ type: 'varchar', name: 'approved_by_id', nullable: true })
  approvedById: string | null;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
