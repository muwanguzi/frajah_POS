import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('delivery_notes')
export class DeliveryNote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'dn_number', unique: true, length: 50 })
  dnNumber: string;

  @Column({ type: 'varchar', name: 'order_id', nullable: true })
  orderId: string | null;

  @Column({ name: 'branch_id' })
  branchId: string;

  @Column({ type: 'varchar', name: 'delivered_by', nullable: true, length: 200 })
  deliveredBy: string | null;

  @Column({ name: 'delivered_at', type: 'timestamp', nullable: true })
  deliveredAt: Date | null;

  @Column({ length: 30, default: 'PENDING' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
