import { Module } from '@nestjs/common';
import { TemperatureRecordsController } from './temperature-records.controller';
import { TemperatureRecordsService } from './temperature-records.service';

@Module({
  controllers: [TemperatureRecordsController],
  providers: [TemperatureRecordsService]
})
export class TemperatureRecordsModule {}

