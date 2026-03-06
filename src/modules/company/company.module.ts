import { Module } from '@nestjs/common';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { UsersModule } from '../users/users.module';

@Module({
  controllers: [CompanyController],
  providers: [CompanyService],
  imports: [UsersModule],
})
export class CompanyModule {}
