import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    // 1. Initialize the PostgreSQL driver adapter
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });

    // 2. Pass the adapter to the PrismaClient constructor
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
