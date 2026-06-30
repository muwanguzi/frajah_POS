import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('settings')
@Unique(['key', 'branchId'])
export class Setting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  key: string;

  @Column({ type: 'jsonb' })
  value: unknown;

  @Column({ type: 'varchar', name: 'branch_id', nullable: true })
  branchId: string | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
