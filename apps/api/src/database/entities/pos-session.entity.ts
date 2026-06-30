import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('pos_sessions')
export class POSSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'branch_id' })
  branchId: string;

  @Column({ name: 'cashier_id' })
  cashierId: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'cashier_id' })
  cashier: User;

  @Column({
    name: 'opening_cash',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: '0',
  })
  openingCash: string;

  @Column({
    name: 'closing_cash',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  closingCash: string | null;

  @Column({ length: 20, default: 'OPEN' })
  status: string;

  @Column({
    name: 'opened_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  openedAt: Date;

  @Column({ name: 'closed_at', type: 'timestamp', nullable: true })
  closedAt: Date | null;

  @Column({ nullable: true, type: 'text' })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
