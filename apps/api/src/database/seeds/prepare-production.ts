import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Role } from '../../common/enums/role.enum';

type AdminSeed = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

async function prepareProduction() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'franjah_pos',
    entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
    synchronize: false,
  });

  await dataSource.initialize();

  // ── 1. Ensure Main Branch exists ───────────────────────────────────────────
  const branchResult = await dataSource.query(`
    INSERT INTO branches (name, code, address, phone, is_main, is_active)
    VALUES ('Main Branch', 'MAIN', 'Kampala, Uganda', '+256700000000', true, true)
    ON CONFLICT (code) DO NOTHING
    RETURNING id
  `);
  const branchRow = branchResult[0] ?? await dataSource.query(
    `SELECT id FROM branches WHERE code = 'MAIN' LIMIT 1`
  ).then((r: Array<{ id: string }>) => r[0]);
  const branchId: string = branchRow.id;
  console.log(`Branch: ${branchId}`);

  // ── 2. Clear all sample inventory data ────────────────────────────────────
  console.log('Clearing sample inventory data...');
  await dataSource.query(`DELETE FROM stock_levels`);
  await dataSource.query(`DELETE FROM product_batches`);
  await dataSource.query(`DELETE FROM products`);
  console.log('Sample inventory cleared.');

  // ── 3. Clear all users and insert real admins ─────────────────────────────
  console.log('Replacing users...');
  await dataSource.query(`DELETE FROM users`);

  const admins: AdminSeed[] = [
    {
      email: 'muwanguzifrancis1@gmail.com',
      password: 'Francis@2026!',
      firstName: 'Francis',
      lastName: 'Muwanguzi',
    },
    {
      email: 'faridahtibikoma@gmail.com',
      password: 'Faridah@2026!',
      firstName: 'Faridah',
      lastName: 'Tibikoma',
    },
  ];

  for (const admin of admins) {
    const passwordHash = await bcrypt.hash(admin.password, 10);
    await dataSource.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, branch_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)`,
      [admin.email, passwordHash, admin.firstName, admin.lastName, Role.ADMIN, branchId]
    );
  }

  // ── 4. Summary ────────────────────────────────────────────────────────────
  console.log('\nProduction database ready.');
  console.log('Admin accounts:');
  for (const admin of admins) {
    console.log(`  ${admin.firstName} ${admin.lastName} <${admin.email}> / ${admin.password}`);
  }
  console.log('\nKeep these credentials secure. Change passwords after first login.');

  await dataSource.destroy();
}

prepareProduction().catch((err) => {
  console.error('Production preparation failed:', err);
  process.exit(1);
});
