import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('branches')
export class Branch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  name: string;

  @Column({ unique: true, length: 20 })
  code: string;

  @Column({ nullable: true, type: 'text' })
  address: string | null;

  @Column({ type: 'varchar', nullable: true, length: 20 })
  phone: string | null;

  @Column({ name: 'is_main', default: false })
  isMain: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
