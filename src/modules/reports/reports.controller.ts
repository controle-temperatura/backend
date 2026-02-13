import { BadRequestException, Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportType, Role } from '@prisma/client';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { User } from '../../common/decorators/user.decorator';
import * as path from 'path';
import * as fs from 'fs';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/role.decorator';

@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) {}

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.AUDITOR)
    @Get('updateTablePage')
    async updateTablePage(@Query('page') page: string, @Query('limit') limit: string) {
        return this.reportsService.updateTablePage(page, limit);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.AUDITOR)
    @Get('saved/list')
    async listSavedReports(@User() user: any) {
        const userId = user.sub;
        return this.reportsService.listReports(userId);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.AUDITOR)
    @Get('saved/:id')
    async getReportFile(@Param('id') id: string, @Res() res: Response) {
        const report = await this.reportsService.getReportById(id);
        
        const filePath = path.join(process.cwd(), report.fileUrl);
        
        if (!fs.existsSync(filePath)) {
            throw new BadRequestException('Arquivo não encontrado');
        }
        
        const fileBuffer = fs.readFileSync(filePath);
        const extension = path.extname(report.fileUrl).toLowerCase();
        const contentTypes = {
            '.pdf': 'application/pdf',
            '.csv': 'text/csv; charset=utf-8',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        };
        const contentType = contentTypes[extension] ?? 'application/octet-stream';
        
        res.set({
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${path.basename(report.fileUrl)}"`,
            'Content-Length': fileBuffer.length,
        });
        
        res.end(fileBuffer);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.AUDITOR)
    @Get(':type')
    async create(
        @Param('type') type: string,
        @Query() filters: any,
        @Res() res: Response,
        @User() user: { userId: string }
    ) {
        const reportType = type.toUpperCase() as ReportType;
        const userId = user.userId;
        const format = String(filters.format || '').toLowerCase();
        
        if (!Object.values(ReportType).includes(reportType)) {
            throw new BadRequestException('Tipo de relatório inválido');
        }

        if (format === 'pdf') {
            let pdfBuffer: Buffer;
            let filename: string;
            let savedReport: any;

            if (reportType === ReportType.CONFORMITY) {
                const result = await this.reportsService.generateConformityReportPDF(filters, userId);
                pdfBuffer = result.pdfBuffer;
                savedReport = result.report;
                filename = `relatorio-conformidade-${new Date().getTime()}.pdf`;
            } else if (
                reportType === ReportType.DAILY || 
                reportType === ReportType.WEEKLY || 
                reportType === ReportType.MONTHLY
            ) {
                const result = await this.reportsService.generatePeriodReportPDF(reportType, filters, userId);
                pdfBuffer = result.pdfBuffer;
                savedReport = result.report;
                
                const reportNames = {
                    [ReportType.DAILY]: 'diario',
                    [ReportType.WEEKLY]: 'semanal',
                    [ReportType.MONTHLY]: 'mensal'
                };
                
                filename = `relatorio-${reportNames[reportType]}-${new Date().getTime()}.pdf`;
            } else {
                throw new BadRequestException('Tipo de relatório inválido');
            }
            
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': pdfBuffer.length,
            });
            
            res.end(pdfBuffer);
            return;
        }

        if (format === 'csv' || format === 'xlsx') {
            const result = format === 'csv'
                ? await this.reportsService.generateReportCSV(reportType, filters, userId)
                : await this.reportsService.generateReportXLSX(reportType, filters, userId);

            const contentTypes = {
                csv: 'text/csv; charset=utf-8',
                xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            };

            res.set({
                'Content-Type': contentTypes[format],
                'Content-Disposition': `attachment; filename="${result.filename}"`,
                'Content-Length': result.fileBuffer.length,
            });

            res.end(result.fileBuffer);
            return;
        }
        
        const data = await this.reportsService.create(reportType, filters);
        return res.json(data);
    }
}
