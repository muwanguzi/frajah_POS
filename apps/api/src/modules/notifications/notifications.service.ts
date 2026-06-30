import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationLog } from '../../database/entities/notification-log.entity';

export interface SendNotificationDto {
  userId?: string;
  channel: 'email' | 'sms' | 'push';
  recipient: string;
  subject?: string;
  body: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationLog)
    private notificationLogRepository: Repository<NotificationLog>,
  ) {}

  async send(dto: SendNotificationDto): Promise<NotificationLog> {
    const log = this.notificationLogRepository.create({
      userId: dto.userId ?? null,
      channel: dto.channel,
      recipient: dto.recipient,
      subject: dto.subject ?? null,
      body: dto.body,
      status: 'PENDING',
    });

    const saved = await this.notificationLogRepository.save(log);

    // TODO: Wire up real email/SMS providers (nodemailer, Twilio etc.)
    try {
      // Simulated send
      await this.notificationLogRepository.update(saved.id, {
        status: 'SENT',
        sentAt: new Date(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.notificationLogRepository.update(saved.id, {
        status: 'FAILED',
        errorMessage: message,
      });
    }

    return saved;
  }

  async findAll(
    page = 1,
    limit = 20,
  ): Promise<{ data: NotificationLog[]; total: number }> {
    const [data, total] = await this.notificationLogRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }
}
