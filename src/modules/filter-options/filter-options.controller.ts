import { Controller, Get } from '@nestjs/common';
import { FilterOptionsService } from './filter-options.service';

@Controller('filter-options')
export class FilterOptionsController {
    constructor(private readonly filterOptionsService: FilterOptionsService) {}

    @Get('tables')
    async getSectors() {
        return this.filterOptionsService.getTableOptions();
    }
}
