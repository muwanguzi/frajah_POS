import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BatchesService } from './batches.service';
import { BatchesController } from './batches.controller';
import { ProductBatch } from '../../database/entities/product-batch.entity';
import { StockLevel } from '../../database/entities/stock-level.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProductBatch, StockLevel])],
  controllers: [BatchesController],
  providers: [BatchesService],
  exports: [BatchesService],
})
export class BatchesModule {}
