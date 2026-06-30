import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { POSTransaction } from '../../database/entities/pos-transaction.entity';
import { Product } from '../../database/entities/product.entity';
import { StockLevel } from '../../database/entities/stock-level.entity';
import { PurchaseOrder } from '../../database/entities/purchase-order.entity';
import { Expense } from '../../database/entities/expense.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      POSTransaction,
      Product,
      StockLevel,
      PurchaseOrder,
      Expense,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
