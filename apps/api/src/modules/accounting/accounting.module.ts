import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountingController } from './accounting.controller';
import { AccountingService } from './accounting.service';
import { Account } from '../../database/entities/account.entity';
import { JournalEntry } from '../../database/entities/journal-entry.entity';
import { JournalEntryLine } from '../../database/entities/journal-entry-line.entity';
import { CashbookEntry } from '../../database/entities/cashbook-entry.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Account,
      JournalEntry,
      JournalEntryLine,
      CashbookEntry,
    ]),
  ],
  controllers: [AccountingController],
  providers: [AccountingService],
  exports: [AccountingService],
})
export class AccountingModule {}
