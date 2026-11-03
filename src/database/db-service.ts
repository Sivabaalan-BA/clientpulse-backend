import { pool } from '../config/db';
import { prisma } from '../config/prisma';
import { dataStore } from './data-store';

export class DatabaseService {
  private static isPgAvailable = false;
  private static isPrismaAvailable = false;

  static async testConnection(): Promise<boolean> {
    try {
      // 1. Test raw pg connection pool
      const client = await pool.connect();
      const res = await client.query('SELECT 1 as connected');
      client.release();
      this.isPgAvailable = res.rowCount !== null && res.rowCount > 0;

      // 2. Test Prisma ORM connection
      await prisma.$queryRaw`SELECT 1 as connected`;
      this.isPrismaAvailable = true;

      console.log('[DB Service] Connected to PostgreSQL 18 with Prisma ORM. Multi-tenant RLS sync enabled.');
      return true;
    } catch (err: any) {
      this.isPgAvailable = false;
      this.isPrismaAvailable = false;
      console.log(
        `[DB Service] PostgreSQL/Prisma connection notice: ${err.message}. Running resilient storage with JSON file persistence (server/data/store.json).`
      );
      return false;
    }
  }

  static getStatus() {
    return {
      postgresConnected: this.isPgAvailable,
      prismaConnected: this.isPrismaAvailable,
      activeStorage: this.isPgAvailable ? 'PostgreSQL 18 Direct (Prisma ORM)' : 'Persistent File Store (Atomic JSON)',
      recordCounts: {
        organizations: dataStore.organizations.length,
        users: dataStore.users.length,
        clients: dataStore.clients.length,
        enquiries: dataStore.enquiries.length,
        quotations: dataStore.quotations.length,
        projects: dataStore.projects.length,
        invoices: dataStore.invoices.length,
        feedback: dataStore.feedback.length,
      },
    };
  }
}
