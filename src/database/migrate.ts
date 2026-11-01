import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const ensureDatabaseExists = async () => {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '5432', 10);
  const user = process.env.DB_USER || 'postgres';
  const password = process.env.DB_PASSWORD || 'postgres';
  const dbName = process.env.DB_NAME || 'clientpulse';

  const defaultClient = new Client({
    host,
    port,
    user,
    password,
    database: 'postgres', // connect to default maintenance database
  });

  try {
    await defaultClient.connect();
    const checkRes = await defaultClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (checkRes.rowCount === 0) {
      console.log(`[DB] Database "${dbName}" does not exist. Creating...`);
      await defaultClient.query(`CREATE DATABASE "${dbName}"`);
      console.log(`[DB] Database "${dbName}" created successfully.`);
    } else {
      console.log(`[DB] Database "${dbName}" already exists.`);
    }
  } catch (err: any) {
    console.error(`[DB] Warning during database existence check:`, err.message);
  } finally {
    await defaultClient.end();
  }
};

const runMigrations = async () => {
  console.log('[DB] Starting ClientPulse schema migration...');
  await ensureDatabaseExists();

  const appClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'clientpulse',
  });

  try {
    await appClient.connect();
    console.log('[DB] Connected to PostgreSQL. Applying migrations...');

    const migrationFile = path.join(__dirname, 'migrations', '001_initial_schema.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');

    await appClient.query(sql);
    console.log('[DB] Migration "001_initial_schema.sql" executed successfully!');
  } catch (err: any) {
    console.error('[DB] Migration failed:', err);
    process.exit(1);
  } finally {
    await appClient.end();
  }
};

runMigrations();
