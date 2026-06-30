import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all settings' })
  findAll(@Query('branchId') branchId?: string) {
    return this.settingsService.findAll(branchId);
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get a setting by key' })
  get(@Param('key') key: string, @Query('branchId') branchId?: string) {
    return this.settingsService.get(key, branchId);
  }

  @Put(':key')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Set a setting value' })
  set(
    @Param('key') key: string,
    @Body() body: { value: unknown; branchId?: string },
  ) {
    return this.settingsService.set(key, body.value, body.branchId);
  }

  @Delete(':key')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a setting' })
  async remove(
    @Param('key') key: string,
    @Query('branchId') branchId?: string,
  ) {
    await this.settingsService.remove(key, branchId);
    return { message: 'Setting removed' };
  }
}
