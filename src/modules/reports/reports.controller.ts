import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportType } from '@prisma/client';

@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) {}

    @Get(':type')
    create(@Param('type') type: ReportType, @Query() filters: any) {
        return this.reportsService.create(type.toUpperCase() as ReportType, filters);
    }
}
