import { Test, TestingModule } from '@nestjs/testing';
import { TemperatureRecordController } from './temperature-record.controller';

describe('TemperatureRecordController', () => {
  let controller: TemperatureRecordController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TemperatureRecordController],
    }).compile();

    controller = module.get<TemperatureRecordController>(TemperatureRecordController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
