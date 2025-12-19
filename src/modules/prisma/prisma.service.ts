import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dayjs from '../../common/utils/dayjs.config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly pool: Pool;

  constructor(private readonly configService: ConfigService) {
    const databaseUrl = configService.get<string>('DATABASE_URL');

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not set in the environment variables.');
    }

    const pool = new Pool({
      connectionString: databaseUrl,
      // Set PostgreSQL session timezone to America/Sao_Paulo
      options: '-c timezone=America/Sao_Paulo',
    });

    super({
      adapter: new PrismaPg(pool),
    });

    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
    
    await this.$executeRaw`SHOW timezone`;
    await this.$executeRaw`SET timezone = 'America/Sao_Paulo'`;
    
    await this.verifyTimezone();
  }

  async verifyTimezone() {
    try {
      const result = await this.$queryRaw<Array<{ timezone: string }>>`SHOW timezone`;
      const timezone = result[0]?.timezone;
      console.log('✅ PostgreSQL Timezone:', timezone);
      
      const now = await this.$queryRaw<Array<{ now: Date }>>`SELECT NOW() as now`;
      console.log('✅ Current DB Time:', now[0]?.now);
      console.log('✅ Dayjs Time:', dayjs().format('YYYY-MM-DD HH:mm:ss Z'));

      console.log('NOW:', new Date());
      console.log('TZ:', Intl.DateTimeFormat().resolvedOptions().timeZone);
    } catch (error) {
      console.error('❌ Error verifying timezone:', error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}
