import { Test, TestingModule } from '@nestjs/testing';
import { FilterOptionsService } from './filter-options.service';

describe('FilterOptionsService', () => {
  let service: FilterOptionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FilterOptionsService],
    }).compile();

    service = module.get<FilterOptionsService>(FilterOptionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
