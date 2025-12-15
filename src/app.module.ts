import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ConfigModule } from '@nestjs/config';
import { TemperatureRecordModule } from './modules/temperature-record/temperature-record.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), 
    PrismaModule, 
    AuthModule, 
    UsersModule,
    TemperatureRecordModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
