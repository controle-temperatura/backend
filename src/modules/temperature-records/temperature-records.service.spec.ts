import { Test, TestingModule } from '@nestjs/testing';
import { TemperatureRecordsService } from './temperature-records.service';

describe('TemperatureRecordsService', () => {
  let service: TemperatureRecordsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TemperatureRecordsService],
    }).compile();

    service = module.get<TemperatureRecordsService>(TemperatureRecordsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

