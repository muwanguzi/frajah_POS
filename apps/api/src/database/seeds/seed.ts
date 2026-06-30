import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'franjah_pos',
    entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
    synchronize: true,
  });

  await dataSource.initialize();

  // Seed branches
  const branchRepo = dataSource.getRepository('branches');
  let mainBranch = await branchRepo.findOne({ where: { code: 'MAIN' } });
  if (!mainBranch) {
    mainBranch = await branchRepo.save({
      name: 'Main Branch',
      code: 'MAIN',
      address: 'Kampala, Uganda',
      phone: '+256700000000',
      is_main: true,
    });
    console.log('Main branch created');
  }

  // Seed admin user
  const userRepo = dataSource.getRepository('users');
  const adminExists = await userRepo.findOne({
    where: { email: 'admin@franjah.com' },
  });
  if (!adminExists) {
    const passwordHash = await bcrypt.hash('Admin@123', 10);
    await userRepo.save({
      email: 'admin@franjah.com',
      firstName: 'System',
      lastName: 'Administrator',
      passwordHash,
      role: 'admin',
      branchId: mainBranch.id,
    });
    console.log('Admin user created: admin@franjah.com / Admin@123');
  }

  // Seed categories
  const categoryRepo = dataSource.getRepository('categories');
  const defaultCategories = [
    'Electronics',
    'Clothing',
    'Food & Beverages',
    'Household',
    'Health & Beauty',
    'Stationery',
  ];
  for (const name of defaultCategories) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const exists = await categoryRepo.findOne({ where: { slug } });
    if (!exists) {
      await categoryRepo.save({ name, slug });
    }
  }
  console.log('Categories seeded');

  // Seed expense categories
  const expCatRepo = dataSource.getRepository('expense_categories');
  const expenseCategories = [
    'Rent',
    'Salaries',
    'Electricity',
    'Water',
    'Fuel',
    'Marketing',
    'Repairs',
    'Miscellaneous',
  ];
  for (const name of expenseCategories) {
    const exists = await expCatRepo.findOne({ where: { name } });
    if (!exists) await expCatRepo.save({ name });
  }
  console.log('Expense categories seeded');

  // Seed chart of accounts
  const accountRepo = dataSource.getRepository('accounts');
  const accounts = [
    { code: '1000', name: 'Cash', type: 'Asset' },
    { code: '1010', name: 'Bank Account', type: 'Asset' },
    { code: '1100', name: 'Accounts Receivable', type: 'Asset' },
    { code: '1200', name: 'Inventory', type: 'Asset' },
    { code: '2000', name: 'Accounts Payable', type: 'Liability' },
    { code: '2100', name: 'VAT Payable', type: 'Liability' },
    { code: '2200', name: 'Salaries Payable', type: 'Liability' },
    { code: '3000', name: "Owner's Equity", type: 'Equity' },
    { code: '4000', name: 'Sales Revenue', type: 'Revenue' },
    { code: '4100', name: 'Other Income', type: 'Revenue' },
    { code: '5000', name: 'Cost of Goods Sold', type: 'Expense' },
    { code: '5100', name: 'Rent Expense', type: 'Expense' },
    { code: '5200', name: 'Salaries Expense', type: 'Expense' },
    { code: '5300', name: 'Utilities Expense', type: 'Expense' },
    { code: '5400', name: 'Marketing Expense', type: 'Expense' },
    { code: '5900', name: 'Miscellaneous Expense', type: 'Expense' },
  ];
  for (const acc of accounts) {
    const exists = await accountRepo.findOne({ where: { code: acc.code } });
    if (!exists) await accountRepo.save({ ...acc, isSystem: true });
  }
  console.log('Chart of accounts seeded');

  // Seed settings
  const settingRepo = dataSource.getRepository('settings');
  const defaultSettings = [
    { key: 'costingMethod', value: 'FIFO' },
    { key: 'currency', value: 'UGX' },
    { key: 'vatRate', value: '18' },
    { key: 'businessName', value: 'Franjah Business' },
    { key: 'receiptPrefix', value: 'FRJ' },
  ];
  for (const setting of defaultSettings) {
    const exists = await settingRepo.findOne({
      where: { key: setting.key, branchId: null },
    });
    if (!exists)
      await settingRepo.save({ key: setting.key, value: setting.value });
  }
  console.log('Settings seeded');

  console.log('Seed completed successfully');
  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
