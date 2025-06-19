import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async cleanDb() {
    if (process.env.NODE_ENV === 'test') {
      const models = Reflect.ownKeys(this).filter(key => typeof key === 'string' && key[0] !== '_');
      return Promise.all(models.map((modelKey) => (this as any)[modelKey].deleteMany()));
    }
  }
}
