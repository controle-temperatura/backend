import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SectorsController } from './sectors.controller';
import { SectorsService } from './sectors.service';

@Module({
  controllers: [SectorsController],
  providers: [SectorsService, PrismaService],
})
export class SectorsModule {}

