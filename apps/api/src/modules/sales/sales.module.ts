import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { SaleOrder } from '../../database/entities/sale-order.entity';
import { SaleOrderItem } from '../../database/entities/sale-order-item.entity';
import { Invoice } from '../../database/entities/invoice.entity';
import { Quote } from '../../database/entities/quote.entity';
import { DeliveryNote } from '../../database/entities/delivery-note.entity';
import { CreditNote } from '../../database/entities/credit-note.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SaleOrder,
      SaleOrderItem,
      Invoice,
      Quote,
      DeliveryNote,
      CreditNote,
    ]),
  ],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
