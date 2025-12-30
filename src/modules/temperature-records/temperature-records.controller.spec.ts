import { Test, TestingModule } from '@nestjs/testing';
import { TemperatureRecordsController } from './temperature-records.controller';

describe('TemperatureRecordsController', () => {
  let controller: TemperatureRecordsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TemperatureRecordsController],
    }).compile();

    controller = module.get<TemperatureRecordsController>(TemperatureRecordsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

