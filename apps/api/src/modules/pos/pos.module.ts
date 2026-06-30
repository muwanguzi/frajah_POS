import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { POSController } from './pos.controller';
import { POSService } from './pos.service';
import { POSSession } from '../../database/entities/pos-session.entity';
import { POSTransaction } from '../../database/entities/pos-transaction.entity';
import { POSTransactionItem } from '../../database/entities/pos-transaction-item.entity';
import { POSPayment } from '../../database/entities/pos-payment.entity';
import { StockLevel } from '../../database/entities/stock-level.entity';
import { Product } from '../../database/entities/product.entity';
import { BatchesModule } from '../batches/batches.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      POSSession,
      POSTransaction,
      POSTransactionItem,
      POSPayment,
      StockLevel,
      Product,
    ]),
    BatchesModule,
  ],
  controllers: [POSController],
  providers: [POSService],
  exports: [POSService],
})
export class POSModule {}
