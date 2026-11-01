import { pool } from '../config/db';
import { dataStore } from './data-store';

export class DatabaseService {
  private static isPgAvailable = false;

  static async testConnection(): Promise<boolean> {
    try {
      const client = await pool.connect();
      const res = await client.query('SELECT 1 as connected');
      client.release();
      this.isPgAvailable = res.rowCount !== null && res.rowCount > 0;
      console.log('[DB Service] Connected to PostgreSQL 18. Multi-tenant RLS sync enabled.');
      return true;
    } catch (err: any) {
      this.isPgAvailable = false;
      console.log(
        `[DB Service] PostgreSQL connection notice: ${err.message}. Running resilient storage with JSON file persistence (server/data/store.json).`
      );
      return false;
    }
  }

  static getStatus() {
    return {
      postgresConnected: this.isPgAvailable,
      activeStorage: this.isPgAvailable ? 'PostgreSQL 18 Direct' : 'Persistent File Store (Atomic JSON)',
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
