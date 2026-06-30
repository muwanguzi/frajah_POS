import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../../common/enums/role.enum';
import { Branch } from './branch.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ type: 'varchar', nullable: true, length: 20 })
  phone: string | null;

  @Column({ name: 'password_hash', select: false })
  passwordHash: string;

  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @Column({ type: 'enum', enum: Role, default: Role.CASHIER })
  role: Role;

  @Column({ type: 'varchar', name: 'branch_id', nullable: true })
  branchId: string | null;

  @ManyToOne(() => Branch, { nullable: true, eager: false })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'varchar', name: 'two_factor_secret', nullable: true, select: false })
  twoFactorSecret: string | null;

  @Column({ name: 'two_factor_enabled', default: false })
  twoFactorEnabled: boolean;

  @Column({ type: 'timestamp', name: 'last_login_at', nullable: true })
  lastLoginAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
