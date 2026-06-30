import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { Branch } from '../../database/entities/branch.entity';

@ApiTags('Branches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @ApiOperation({ summary: 'List all branches' })
  findAll() {
    return this.branchesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get branch by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.branchesService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a branch' })
  create(@Body() dto: Partial<Branch>) {
    return this.branchesService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a branch' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: Partial<Branch>) {
    return this.branchesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Deactivate a branch' })
  async deactivate(@Param('id', ParseUUIDPipe) id: string) {
    await this.branchesService.deactivate(id);
    return { message: 'Branch deactivated' };
  }
}
