import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BranchesModule } from './modules/branches/branches.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { PurchasingModule } from './modules/purchasing/purchasing.module';
import { BatchesModule } from './modules/batches/batches.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { CustomersModule } from './modules/customers/customers.module';
import { POSModule } from './modules/pos/pos.module';
import { SalesModule } from './modules/sales/sales.module';
import { AccountingModule } from './modules/accounting/accounting.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { ReportsModule } from './modules/reports/reports.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuditModule } from './modules/audit/audit.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { SettingsModule } from './modules/settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', ''),
        database: configService.get('DB_NAME', 'franjah_pos'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
      }),
    }),
    AuthModule,
    UsersModule,
    BranchesModule,
    CategoriesModule,
    ProductsModule,
    SuppliersModule,
    PurchasingModule,
    BatchesModule,
    InventoryModule,
    CustomersModule,
    POSModule,
    SalesModule,
    AccountingModule,
    ExpensesModule,
    ReportsModule,
    NotificationsModule,
    AuditModule,
    DashboardModule,
    SettingsModule,
  ],
})
export class AppModule {}
