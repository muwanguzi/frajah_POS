import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Setting } from '../../database/entities/setting.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private settingRepository: Repository<Setting>,
  ) {}

  async findAll(branchId?: string): Promise<Setting[]> {
    if (branchId) {
      return this.settingRepository.find({
        where: [{ branchId }, { branchId: IsNull() as any }],
        order: { key: 'ASC' },
      });
    }
    return this.settingRepository.find({
      where: { branchId: IsNull() as any },
      order: { key: 'ASC' },
    });
  }

  async get(key: string, branchId?: string): Promise<Setting | null> {
    return this.settingRepository.findOne({
      where: { key, branchId: branchId ? branchId : (IsNull() as any) },
    });
  }

  async set(
    key: string,
    value: unknown,
    branchId?: string,
  ): Promise<Setting> {
    const existing = await this.settingRepository.findOne({
      where: { key, branchId: branchId ? branchId : (IsNull() as any) },
    });

    if (existing) {
      existing.value = value;
      return this.settingRepository.save(existing);
    }

    const setting = this.settingRepository.create({
      key,
      value,
      branchId: branchId ?? undefined,
    });
    return this.settingRepository.save(setting);
  }

  async remove(key: string, branchId?: string): Promise<void> {
    const setting = await this.settingRepository.findOne({
      where: { key, branchId: branchId ? branchId : (IsNull() as any) },
    });
    if (!setting) throw new NotFoundException('Setting not found');
    await this.settingRepository.remove(setting);
  }
}
