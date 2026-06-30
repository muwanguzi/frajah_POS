import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 20 })
  code: string;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 30 })
  type: string;

  @Column({ type: 'varchar', name: 'parent_id', nullable: true })
  parentId: string | null;

  @ManyToOne(() => Account, (a) => a.children, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'parent_id' })
  parent: Account | null;

  @OneToMany(() => Account, (a) => a.parent)
  children: Account[];

  @Column({ name: 'is_system', default: false })
  isSystem: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ nullable: true, type: 'text' })
  description: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
