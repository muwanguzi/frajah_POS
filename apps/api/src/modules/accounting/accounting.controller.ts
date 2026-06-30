import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AccountingService } from './accounting.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { Account } from '../../database/entities/account.entity';
import { JournalEntry } from '../../database/entities/journal-entry.entity';
import { CashbookEntry } from '../../database/entities/cashbook-entry.entity';
import { paginate } from '../../common/utils/pagination.util';

@ApiTags('Accounting')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('accounting')
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Get('accounts')
  @ApiOperation({ summary: 'Chart of accounts' })
  findAllAccounts() {
    return this.accountingService.findAllAccounts();
  }

  @Get('accounts/:id')
  @ApiOperation({ summary: 'Get account by ID' })
  findAccountById(@Param('id', ParseUUIDPipe) id: string) {
    return this.accountingService.findAccountById(id);
  }

  @Post('accounts')
  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Create account' })
  createAccount(@Body() dto: Partial<Account>) {
    return this.accountingService.createAccount(dto);
  }

  @Patch('accounts/:id')
  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Update account' })
  updateAccount(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<Account>,
  ) {
    return this.accountingService.updateAccount(id, dto);
  }

  @Get('journal-entries')
  @Roles(Role.ADMIN, Role.ACCOUNTANT, Role.AUDITOR)
  @ApiOperation({ summary: 'List journal entries' })
  async findAllJournalEntries(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const { data, total } = await this.accountingService.findAllJournalEntries(
      Number(page),
      Number(limit),
    );
    return paginate(data, total, { page: Number(page), limit: Number(limit) });
  }

  @Post('journal-entries')
  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Create journal entry' })
  createJournalEntry(@Body() dto: Partial<JournalEntry>) {
    return this.accountingService.createJournalEntry(dto);
  }

  @Patch('journal-entries/:id/post')
  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Post a journal entry' })
  async postJournalEntry(@Param('id', ParseUUIDPipe) id: string) {
    await this.accountingService.postJournalEntry(id);
    return { message: 'Journal entry posted' };
  }

  @Get('cashbook')
  @Roles(Role.ADMIN, Role.ACCOUNTANT, Role.MANAGER, Role.AUDITOR)
  @ApiOperation({ summary: 'List cashbook entries' })
  async findAllCashbookEntries(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('branchId') branchId?: string,
  ) {
    const { data, total } =
      await this.accountingService.findAllCashbookEntries(
        Number(page),
        Number(limit),
        branchId,
      );
    return paginate(data, total, { page: Number(page), limit: Number(limit) });
  }

  @Post('cashbook')
  @Roles(Role.ADMIN, Role.ACCOUNTANT, Role.MANAGER)
  @ApiOperation({ summary: 'Create cashbook entry' })
  createCashbookEntry(@Body() dto: Partial<CashbookEntry>) {
    return this.accountingService.createCashbookEntry(dto);
  }
}
