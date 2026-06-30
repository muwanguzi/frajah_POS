import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';

// Shared by both NestJS (app.module.ts) and the TypeORM CLI (migration:generate/run).
// No dotenv here on purpose — in Docker, env vars are injected directly by Compose;
// locally, these defaults match apps/api/.env (same pattern used by the seed scripts).
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'franjah_pos',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  migrationsTableName: 'migrations',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
};

export default new DataSource(dataSourceOptions);
