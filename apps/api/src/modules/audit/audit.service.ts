import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../database/entities/audit-log.entity';

export interface CreateAuditLogDto {
  userId?: string;
  branchId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(dto: CreateAuditLogDto): Promise<AuditLog> {
    const entry = this.auditLogRepository.create({
      userId: dto.userId ?? null,
      branchId: dto.branchId ?? null,
      action: dto.action,
      entityType: dto.entityType,
      entityId: dto.entityId ?? null,
      oldValues: dto.oldValues ?? null,
      newValues: dto.newValues ?? null,
      ipAddress: dto.ipAddress ?? null,
      userAgent: dto.userAgent ?? null,
    });
    return this.auditLogRepository.save(entry);
  }

  async findAll(
    page = 1,
    limit = 20,
    entityType?: string,
    userId?: string,
  ): Promise<{ data: AuditLog[]; total: number }> {
    const qb = this.auditLogRepository.createQueryBuilder('log');
    if (entityType) qb.andWhere('log.entity_type = :entityType', { entityType });
    if (userId) qb.andWhere('log.user_id = :userId', { userId });
    qb.orderBy('log.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }
}
