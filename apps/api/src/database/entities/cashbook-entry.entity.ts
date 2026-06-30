import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('cashbook_entries')
export class CashbookEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'branch_id' })
  branchId: string;

  @Column({ type: 'varchar', name: 'account_id', nullable: true })
  accountId: string | null;

  @Column({ length: 20 })
  type: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: string;

  @Column({ name: 'payee_payer', length: 255 })
  payeePayer: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'transaction_date', type: 'date' })
  transactionDate: string;

  @Column({ type: 'varchar', nullable: true, length: 100 })
  reference: string | null;

  @Column({ name: 'is_reconciled', default: false })
  isReconciled: boolean;

  @Column({ type: 'varchar', name: 'created_by_id', nullable: true })
  createdById: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
