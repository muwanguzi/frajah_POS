import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { POSTransaction } from '../../database/entities/pos-transaction.entity';
import { POSTransactionItem } from '../../database/entities/pos-transaction-item.entity';
import { Expense } from '../../database/entities/expense.entity';
import { ExpenseCategory } from '../../database/entities/expense-category.entity';
import { StockLevel } from '../../database/entities/stock-level.entity';
import { ProductBatch } from '../../database/entities/product-batch.entity';
import { PurchaseOrder } from '../../database/entities/purchase-order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      POSTransaction,
      POSTransactionItem,
      Expense,
      ExpenseCategory,
      StockLevel,
      ProductBatch,
      PurchaseOrder,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
