import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from '../../database/entities/branch.entity';

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(Branch)
    private branchRepository: Repository<Branch>,
  ) {}

  async findAll(): Promise<Branch[]> {
    return this.branchRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Branch> {
    const branch = await this.branchRepository.findOne({ where: { id } });
    if (!branch) throw new NotFoundException('Branch not found');
    return branch;
  }

  async create(data: Partial<Branch>): Promise<Branch> {
    const branch = this.branchRepository.create(data);
    return this.branchRepository.save(branch);
  }

  async update(id: string, data: Partial<Branch>): Promise<Branch> {
    await this.findOne(id);
    await this.branchRepository.update(id, data);
    return this.findOne(id);
  }

  async deactivate(id: string): Promise<void> {
    await this.findOne(id);
    await this.branchRepository.update(id, { isActive: false });
  }
}
