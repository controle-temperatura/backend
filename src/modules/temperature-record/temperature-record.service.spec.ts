import { Test, TestingModule } from '@nestjs/testing';
import { TemperatureRecordService } from './temperature-record.service';

describe('TemperatureRecordService', () => {
  let service: TemperatureRecordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TemperatureRecordService],
    }).compile();

    service = module.get<TemperatureRecordService>(TemperatureRecordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
