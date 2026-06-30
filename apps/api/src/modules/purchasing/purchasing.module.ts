import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchasingController } from './purchasing.controller';
import { PurchasingService } from './purchasing.service';
import { PurchaseOrder } from '../../database/entities/purchase-order.entity';
import { PurchaseOrderItem } from '../../database/entities/purchase-order-item.entity';
import { GoodsReceipt } from '../../database/entities/goods-receipt.entity';
import { GoodsReceiptItem } from '../../database/entities/goods-receipt-item.entity';
import { ProductBatch } from '../../database/entities/product-batch.entity';
import { StockLevel } from '../../database/entities/stock-level.entity';
import { Product } from '../../database/entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PurchaseOrder,
      PurchaseOrderItem,
      GoodsReceipt,
      GoodsReceiptItem,
      ProductBatch,
      StockLevel,
      Product,
    ]),
  ],
  controllers: [PurchasingController],
  providers: [PurchasingService],
  exports: [PurchasingService],
})
export class PurchasingModule {}
