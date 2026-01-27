import { Test, TestingModule } from '@nestjs/testing';
import { FilterOptionsController } from './filter-options.controller';

describe('FilterOptionsController', () => {
  let controller: FilterOptionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilterOptionsController],
    }).compile();

    controller = module.get<FilterOptionsController>(FilterOptionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
