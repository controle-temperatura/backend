import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ConfigModule } from '@nestjs/config';
import { TemperatureRecordsModule } from './modules/temperature-records/temperature-records.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SectorsModule } from './modules/sectors/sectors.module';
import { FoodsModule } from './modules/foods/foods.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { FilterOptionsModule } from './modules/filter-options/filter-options.module';
import { CompanyModule } from './modules/company/company.module';
import { MailModule } from './modules/mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), 
    PrismaModule, 
    AuthModule, 
    UsersModule,
    TemperatureRecordsModule,
    AlertsModule,
    ReportsModule,
    SectorsModule,
    FoodsModule,
    DashboardModule,
    FilterOptionsModule,
    CompanyModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
