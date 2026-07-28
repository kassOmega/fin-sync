import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { Pool } from 'pg';
import { URL } from 'url';

dotenv.config();

export const daysAgo = (days: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(
    Math.floor(Math.random() * 12) + 8,
    Math.floor(Math.random() * 60),
    0,
    0,
  );
  return d;
};

export const daysFromNow = (days: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

export const randomBetween = (
  min: number,
  max: number,
  decimals = 2,
): number => {
  return (
    Math.round((Math.random() * (max - min) + min) * Math.pow(10, decimals)) /
    Math.pow(10, decimals)
  );
};

export const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const randomItem = <T>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)];
};

export const randomItems = <T>(arr: T[], count: number): T[] => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

// Database connection
let _prisma: PrismaClient | null = null;
let _pool: Pool | null = null;

export const getPool = (): Pool | null => _pool;

export const getPrisma = (): PrismaClient => {
  if (_prisma) return _prisma;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('❌ DATABASE_URL environment variable is not set!');
  }

  const url = new URL(connectionString);
  const schema = url.searchParams.get('schema') || 'finsync';

  _pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    options: `-c search_path=${schema}`,
  });

  const adapter = new PrismaPg(_pool);
  _prisma = new PrismaClient({ adapter });

  return _prisma;
};

export const disconnect = async (): Promise<void> => {
  if (_prisma) await _prisma.$disconnect();
  if (_pool) await _pool.end();
};

// Type for storing created record IDs
export interface SeedContext {
  measuringUnits: Record<string, number>;
  users: Record<string, number>;
  companies: Record<string, number>;
  storeCategories: Record<string, number>;
  storeItems: Record<string, number>;
  projects: Record<string, number>;
  machinery: Record<string, number>;
  customers: Record<string, number>;
  suppliers: Record<string, number>;
  employees: Record<string, number>;
  personalAccounts: Record<string, number>;
  companyRoles: Record<string, number>;
}

export const createContext = (): SeedContext => ({
  measuringUnits: {},
  users: {},
  companies: {},
  storeCategories: {},
  storeItems: {},
  projects: {},
  machinery: {},
  customers: {},
  suppliers: {},
  employees: {},
  personalAccounts: {},
  companyRoles: {},
});
