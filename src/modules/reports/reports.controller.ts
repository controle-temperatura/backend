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
    @Get(':type')
    async create(
        @Param('type') type: string,
        @Query() filters: any,
        @Res() res: Response,
        @User() user: { userId: string }
    ) {
        const reportType = type.toUpperCase() as ReportType;
        const userId = user.userId;
        
        if (!Object.values(ReportType).includes(reportType)) {
            throw new BadRequestException('Tipo de relatório inválido');
        }

        if (filters.format === 'pdf') {
            let pdfBuffer: Buffer;
            let filename: string;
            let savedReport: any;

            if (reportType === ReportType.CONFORMITY) {
                console.log('conformity');
                const result = await this.reportsService.generateConformityReportPDF(filters, userId);
                pdfBuffer = result.pdfBuffer;
                savedReport = result.report;
                filename = `relatorio-conformidade-${new Date().getTime()}.pdf`;
            } else if (
                reportType === ReportType.DAILY || 
                reportType === ReportType.WEEKLY || 
                reportType === ReportType.MONTHLY
            ) {
                console.log('period');
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
                console.log(reportType);
                throw new BadRequestException('Tipo de relatório inválido');
            }
            
            console.log('1')
            
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
        
        const pdfBuffer = fs.readFileSync(filePath);
        
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${path.basename(report.fileUrl)}"`,
            'Content-Length': pdfBuffer.length,
        });
        
        res.end(pdfBuffer);
    }
}
