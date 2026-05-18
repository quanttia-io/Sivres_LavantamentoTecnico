import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    // Conexão lazy — evita falha de startup com pgbouncer após hot-reload
    try {
      await this.$connect();
    } catch {
      // Prisma reconectará automaticamente na primeira query
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
