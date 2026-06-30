import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { StockLevel } from '../../database/entities/stock-level.entity';
import { StockAdjustment } from '../../database/entities/stock-adjustment.entity';
import { StockTransfer } from '../../database/entities/stock-transfer.entity';
import { StockTransferItem } from '../../database/entities/stock-transfer-item.entity';
import { StockCount } from '../../database/entities/stock-count.entity';
import { StockCountItem } from '../../database/entities/stock-count-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StockLevel,
      StockAdjustment,
      StockTransfer,
      StockTransferItem,
      StockCount,
      StockCountItem,
    ]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
