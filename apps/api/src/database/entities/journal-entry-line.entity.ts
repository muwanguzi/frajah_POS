import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { JournalEntry } from './journal-entry.entity';
import { Account } from './account.entity';

@Entity('journal_entry_lines')
export class JournalEntryLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'entry_id' })
  entryId: string;

  @ManyToOne(() => JournalEntry, (e) => e.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'entry_id' })
  entry: JournalEntry;

  @Column({ name: 'account_id' })
  accountId: string;

  @ManyToOne(() => Account, { eager: false })
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @Column({ nullable: true, type: 'text' })
  description: string | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: '0' })
  debit: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: '0' })
  credit: string;
}
