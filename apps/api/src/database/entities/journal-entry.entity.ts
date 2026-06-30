import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { JournalEntryLine } from './journal-entry-line.entity';

@Entity('journal_entries')
export class JournalEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'entry_number', unique: true, length: 50 })
  entryNumber: string;

  @Column({ type: 'varchar', name: 'branch_id', nullable: true })
  branchId: string | null;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'entry_date', type: 'date' })
  entryDate: string;

  @Column({ length: 30, default: 'MANUAL' })
  type: string;

  @Column({ name: 'reference_id', nullable: true, type: 'uuid' })
  referenceId: string | null;

  @Column({ type: 'varchar', name: 'reference_type', nullable: true, length: 50 })
  referenceType: string | null;

  @Column({ name: 'is_posted', default: false })
  isPosted: boolean;

  @Column({ type: 'varchar', name: 'created_by_id', nullable: true })
  createdById: string | null;

  @OneToMany(() => JournalEntryLine, (line) => line.entry, { cascade: true })
  lines: JournalEntryLine[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
