import { Module } from '@nestjs/common';
import { TemperatureRecordController } from './temperature-record.controller';
import { TemperatureRecordService } from './temperature-record.service';

@Module({
  controllers: [TemperatureRecordController],
  providers: [TemperatureRecordService]
})
export class TemperatureRecordModule {}
