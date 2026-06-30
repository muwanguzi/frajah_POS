import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { Customer } from '../../database/entities/customer.entity';
import { LoyaltyTransaction } from '../../database/entities/loyalty-transaction.entity';
import { POSTransaction } from '../../database/entities/pos-transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Customer, LoyaltyTransaction, POSTransaction])],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
