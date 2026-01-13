import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportType } from '@prisma/client';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';

@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) {}

    @UseGuards(JwtAuthGuard)
    @Get(':type')
    async create(
        @Param('type') type: string,
        @Query() filters: any,
        @Res() res: Response
    ) {
        const reportType = type.toUpperCase() as ReportType;
        
        if (filters.format === 'pdf') {
            let pdfBuffer: Buffer;
            let filename: string;

            if (reportType === ReportType.CONFORMITY) {
                pdfBuffer = await this.reportsService.generateConformityReportPDF(filters);
                filename = `relatorio-conformidade-${new Date().getTime()}.pdf`;
            } else if (
                reportType === ReportType.DAILY || 
                reportType === ReportType.WEEKLY || 
                reportType === ReportType.MONTHLY
            ) {
                pdfBuffer = await this.reportsService.generatePeriodReportPDF(reportType, filters);
                
                const reportNames = {
                    [ReportType.DAILY]: 'diario',
                    [ReportType.WEEKLY]: 'semanal',
                    [ReportType.MONTHLY]: 'mensal'
                };
                
                filename = `relatorio-${reportNames[reportType]}-${new Date().getTime()}.pdf`;
            } else {
                const data = await this.reportsService.create(reportType, filters);
                return res.json(data);
            }
            
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': pdfBuffer.length,
            });
            
            res.end(pdfBuffer);
            return;
        }
        
        const data = await this.reportsService.create(reportType, filters);
        return res.json(data);
    }
}
