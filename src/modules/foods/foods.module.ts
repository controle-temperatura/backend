import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FoodsController } from './foods.controller';
import { FoodsService } from './foods.service';

@Module({
    controllers: [FoodsController],
    providers: [FoodsService, PrismaService],
})
export class FoodsModule {}

