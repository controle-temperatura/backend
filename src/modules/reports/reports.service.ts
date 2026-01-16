import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AlertDanger, AlertType, ComplianceStatus, ReportType } from '@prisma/client';
import dayjs from '../../common/utils/dayjs.config';
import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ReportsService {
    constructor(private readonly prisma: PrismaService) {}

    private formatAlertType = (alertType: AlertType): string => {
        const replaces = {
            [AlertType.BELOW_MIN]: 'Abaixo do Recomendado',
            [AlertType.ABOVE_MAX]: 'Acima do Recomendado',
            [AlertType.NEXT_MIN]: 'Próximo da Temperatura Mínima Recomendada',
            [AlertType.NEXT_MAX]: 'Próximo da Temperatura Máxima Recomenda',
        }

        return replaces[alertType];
    }

    async create(type: ReportType, filters: any): Promise<any> {
        const dbQueryFilters: any = {}

        if (type === ReportType.DAILY) {
            const { startOfDay, endOfDay } = this.getDayBoundaries(filters.date);

            dbQueryFilters.createdAt = {
                gte: startOfDay,
                lte: endOfDay,
            };
        }

        else if (type === ReportType.WEEKLY) {
            const { startOfWeek, endOfWeek } = this.getWeekBoundaries(filters.week);
            dbQueryFilters.createdAt = {
                gte: startOfWeek,
                lte: endOfWeek,
            };
        }

        else if (type === ReportType.MONTHLY) {
            const { startOfMonth, endOfMonth } = this.getMonthBoundaries(filters.month);
            dbQueryFilters.createdAt = {
                gte: startOfMonth,
                lte: endOfMonth,
            };
        }

        else if (type === ReportType.CONFORMITY) {
            return this.createConformityReport(filters);
        }

        if (filters.sectorId) {
            dbQueryFilters.food = {
                sectorId: filters.sectorId,
            };
        }

        const records = await this.prisma.temperatureRecord.findMany({ 
            where: dbQueryFilters,
            include: {
                food: {
                    select: {
                        name: true,
                        tempMin: true,
                        tempMax: true,
                        sector: {
                            select: {
                                name: true,
                            }
                        }
                    }
                },
                user: {
                    select: {
                        name: true,
                        role: true
                    }
                },
                alert: {
                    select: {
                        type: true,
                        danger: true,
                        resolved: true,
                        resolvedAt: true,
                        resolvedById: true,
                        resolvedBy: {
                            select: {
                                name: true,
                            }
                        },
                        correctiveAction: true,
                    }
                },
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        return records;
    }

    async createConformityReport(filters: any): Promise<any> {
        const dbQueryFilters: any = {}

        if (filters.sectorId) {
            dbQueryFilters.food = {
                sectorId: filters.sectorId,
            };
        }

        if (filters.date) {
            const { startOfDay, endOfDay } = this.getDayBoundaries(filters.date);
            dbQueryFilters.createdAt = {
                gte: startOfDay,
                lte: endOfDay,
            };
        }

        if (filters.startDate && filters.endDate) {
            const startDate = dayjs(filters.startDate);
            const endDate = dayjs(filters.endDate);

            if (!startDate.isValid() || !endDate.isValid()) {
                throw new BadRequestException('Data inválida');
            }

            dbQueryFilters.createdAt = {
                gte: startDate,
                lte: endDate,
            };
        }
        
        const records = await this.prisma.temperatureRecord.findMany({
            where: dbQueryFilters,
            include: {
                food: {
                    select: {
                        name: true,
                        tempMin: true,
                        tempMax: true,
                        sector: {
                            select: {
                                name: true,
                            }
                        }
                    }
                },
                user: {
                    select: {
                        name: true,
                        role: true
                    }
                },
                alert: {
                    select: {
                        type: true,
                        danger: true,
                        resolved: true,
                        resolvedAt: true,
                        resolvedById: true,
                        resolvedBy: {
                            select: {
                                name: true,
                            }
                        },
                        correctiveAction: true,
                    }
                },
            }
        });

        if (records.length === 0) {
            return {
                "content": 'Nenhum registro encontrado'
            };
        }
        
        const complianceStatus = this.calculateComplianceStatus(records);
        
        const reportsContent = await this.createConformityReportContent(records);
        
        const totalAlerts = records.filter(record => record.alert?.danger === AlertDanger.CRITICAL).length;
        const totalCriticalAlerts = records.filter(record => record.alert?.danger === AlertDanger.CRITICAL).length;
        const totalNonCriticalAlerts = records.filter(record => record.alert?.danger === AlertDanger.ALERT).length;
        const totalResolvedAlerts = records.filter(record => record.alert?.resolved).length;

        return { 
            "content": reportsContent, 
            complianceStatus, 
            "totalRecords": records.length, 
            totalAlerts, 
            totalCriticalAlerts, 
            totalNonCriticalAlerts,
            totalResolvedAlerts
        };
    }

    private getDayBoundaries(date?: string | Date): { startOfDay: Date; endOfDay: Date } {
        const targetDate = date ? dayjs(date) : dayjs();

        if (!targetDate.isValid()) {
            throw new BadRequestException('Data inválida');
        }

        const startOfDay = targetDate.startOf('day').toDate();
        const endOfDay = targetDate.endOf('day').toDate();

        return { startOfDay, endOfDay };
    }

    private getWeekBoundaries(date?: string | Date): { startOfWeek: Date; endOfWeek: Date } {
        const targetDate = date ? dayjs(date) : dayjs();

        if (!targetDate.isValid()) {
            throw new BadRequestException('Data inválida');
        }

        const startOfWeek = targetDate.startOf('week').toDate();
        const endOfWeek = targetDate.endOf('week').toDate();

        return { startOfWeek, endOfWeek };
    }

    private getMonthBoundaries(date?: string | Date): { startOfMonth: Date; endOfMonth: Date } {
        const targetDate = date ? dayjs(date) : dayjs();

        if (!targetDate.isValid()) {
            throw new BadRequestException('Data inválida');
        }
        
        const startOfMonth = targetDate.startOf('month').toDate();
        const endOfMonth = targetDate.endOf('month').toDate();

        return { startOfMonth, endOfMonth };
    }

    private async createConformityReportContent(records: any[]): Promise<Object> {

        const recordsBySector = records.filter(record => record.alert).reduce((acc, record) => {
            const sectorName = record.food?.sector?.name || 'Sem Setor';
            
            if (!acc[sectorName]) {
                acc[sectorName] = [];
            }
            
            acc[sectorName].push({
                foodName: record.food?.name,
                temperature: record.temperature,
                alertType: this.formatAlertType(record.alert?.type),
                resolved: record.alert?.resolved,
                correctiveAction: record.alert?.correctiveAction,
                danger: record.alert?.danger,
            });
            
            return acc;
        }, {});

        return recordsBySector;
    }

    private calculateComplianceStatus(records: any[]): ComplianceStatus {
        let status: ComplianceStatus = ComplianceStatus.COMPLIANT;

        const reported = records.length;
        const resolvedCriticalRecords = records.filter(record => record.alert?.danger === AlertDanger.CRITICAL && record.alert?.resolved).length;
        const nonResolvedCriticalRecords = records.filter(record => record.alert?.danger === AlertDanger.CRITICAL && !record.alert?.resolved).length;
        const nonCriticalRecords = records.filter(record => record.alert?.danger === AlertDanger.ALERT).length;

        const resolvedCriticalPercentage = (resolvedCriticalRecords / reported) * 100;
        const nonResolvedCriticalPercentage = (nonResolvedCriticalRecords / reported) * 100;
        const nonCriticalPercentage = (nonCriticalRecords / reported) * 100;

        if (nonResolvedCriticalRecords > 0 || nonCriticalPercentage > 5 || resolvedCriticalPercentage > 5) {
            status = ComplianceStatus.NON_COMPLIANT;
        }

        else if ((nonCriticalPercentage > 5 || resolvedCriticalPercentage > 5) && !(nonCriticalPercentage > 5 && resolvedCriticalPercentage > 5)) {
            status = ComplianceStatus.PARTIALLY_COMPLIANT;
        }

        return status;
    }

    async generateConformityReportPDF(filters: any, userId: string): Promise<{ pdfBuffer: Buffer; report: any }> {
        const reportData = await this.createConformityReport(filters);

        if (reportData.content === 'Nenhum registro encontrado') {
            throw new BadRequestException('Nenhum registro encontrado para gerar o relatório');
        }

        const html = this.generateConformityReportHTML(reportData, filters);

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        try {
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });
            
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20mm',
                    right: '15mm',
                    bottom: '20mm',
                    left: '15mm'
                }
            });

            const uploadsDir = path.join(process.cwd(), 'uploads', 'reports');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            const filename = `relatorio-conformidade-${Date.now()}.pdf`;
            const filePath = path.join(uploadsDir, filename);
            fs.writeFileSync(filePath, pdfBuffer);

            const period = this.getDateRangeText(filters);
            const report = await this.prisma.report.create({
                data: {
                    type: ReportType.CONFORMITY,
                    period,
                    userId,
                    fileUrl: `uploads/reports/${filename}`,
                    complianceStatus: reportData.complianceStatus,
                }
            });

            return { pdfBuffer: Buffer.from(pdfBuffer), report };
        } finally {
            await browser.close();
        }
    }

    private generateConformityReportHTML(reportData: any, filters: any): string {
        const { 
            content, 
            complianceStatus, 
            totalRecords, 
            totalAlerts,
            totalCriticalAlerts, 
            totalNonCriticalAlerts,
            totalResolvedAlerts 
        } = reportData;

        const complianceStatusText = {
            [ComplianceStatus.COMPLIANT]: 'Conforme',
            [ComplianceStatus.PARTIALLY_COMPLIANT]: 'Parcialmente Conforme',
            [ComplianceStatus.NON_COMPLIANT]: 'Não Conforme'
        };

        const complianceColor = {
            [ComplianceStatus.COMPLIANT]: '#28a745',
            [ComplianceStatus.PARTIALLY_COMPLIANT]: '#ffc107',
            [ComplianceStatus.NON_COMPLIANT]: '#dc3545'
        };

        const dateRange = this.getDateRangeText(filters);
        const generatedDate = dayjs().format('DD/MM/YYYY [às] HH:mm');

        return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Conformidade</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #333;
            line-height: 1.6;
            background: #fff;
        }
        
        .header {
            background: #2F80ED;
            color: white;
            padding: 30px;
            text-align: center;
            margin-bottom: 30px;
        }
        
        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
        }
        
        .header p {
            font-size: 14px;
            opacity: 0.9;
        }
        
        .container {
            padding: 0 20px;
        }
        
        .info-section {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 25px;
            border-left: 4px solid #2F80ED;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 8px 0;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .info-row:last-child {
            border-bottom: none;
        }
        
        .info-label {
            font-weight: 600;
            color: #555;
        }
        
        .info-value {
            color: #333;
        }
        
        .compliance-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            color: white;
            font-weight: 600;
            font-size: 14px;
        }
        
        .statistics {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: #fff;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }
        
        .stat-value {
            font-size: 32px;
            font-weight: bold;
            color: #2F80ED;
            margin-bottom: 5px;
        }
        
        .stat-label {
            font-size: 14px;
            color: #666;
        }
        
        .section-title {
            font-size: 20px;
            font-weight: 600;
            color: #333;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #2F80ED;
        }
        
        .alert-section {
            margin-bottom: 30px;
        }
        
        .alert-item {
            background: #fff;
            border-left: 4px solid #dc3545;
            padding: 15px;
            margin-bottom: 12px;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .alert-item.non-critical {
            border-left-color: #ffc107;
        }
        
        .alert-item p {
            margin: 0;
            font-size: 14px;
            line-height: 1.6;
        }
        
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #e0e0e0;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        
        .page-break {
            page-break-after: always;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Relatório de Conformidade de Temperatura</h1>
        <p>Sistema de Controle de Temperatura</p>
    </div>
    
    <div class="container">
        <div class="info-section">
            <div class="info-row">
                <span class="info-label">Período:</span>
                <span class="info-value">${dateRange}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Data de Geração:</span>
                <span class="info-value">${generatedDate}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Status de Conformidade:</span>
                <span class="info-value">
                    <span class="compliance-badge" style="background-color: ${complianceColor[complianceStatus]}">
                        ${complianceStatusText[complianceStatus]}
                    </span>
                </span>
            </div>
        </div>
        
        <h2 class="section-title">Estatísticas Gerais</h2>
        <div class="statistics">
            <div class="stat-card">
                <div class="stat-value">${totalRecords}</div>
                <div class="stat-label">Total de Registros</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${totalAlerts}</div>
                <div class="stat-label">Total de Alertas</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${totalCriticalAlerts}</div>
                <div class="stat-label">Alertas Críticos</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${totalNonCriticalAlerts}</div>
                <div class="stat-label">Alertas Não Críticos</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${totalResolvedAlerts}</div>
                <div class="stat-label">Alertas Resolvidos</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${totalAlerts - totalResolvedAlerts}</div>
                <div class="stat-label">Alertas Pendentes</div>
            </div>
        </div>
        
        ${this.parseContentToHTML(content)}
        
        <div class="footer">
            <p>Este documento foi gerado automaticamente pelo Sistema de Controle de Temperatura.</p>
            <p>Documento confidencial - uso interno apenas.</p>
        </div>
    </div>
</body>
</html>
        `;
    }

    private parseContentToHTML(content: Object): string {
        let html = '';
        
        for (let [sectorName, records] of Object.entries(content)) {
            html += '<div class="alert-section">';
            html += `<h2 class="section-title">Setor: ${sectorName}</h2>`;
            
            records.forEach(record => {
                const alertClass = record.danger === AlertDanger.CRITICAL ? 'alert-item' : 'alert-item non-critical';
                
                html += `
                <div class="${alertClass}">
                    <p><strong>Alimento:</strong> ${record.foodName}</p>
                    <p><strong>Temperatura:</strong> ${record.temperature} °C</p>
                    <p><strong>Tipo de Alerta:</strong> ${record.alertType}</p>
                    <p><strong>Gravidade:</strong> ${record.danger === AlertDanger.CRITICAL ? 'Crítico' : 'Não Crítico'}</p>
                    <p><strong>Status:</strong> ${record.resolved ? 'Resolvido' : 'Não Resolvido'}</p>
                    <p><strong>Ação Corretiva:</strong> ${record.correctiveAction}</p>
                </div>`;
            });
            
            html += '</div>';
        }
        
        return html;
    }

    private getDateRangeText(filters: any): string {
        if (filters.date) {
            return dayjs(filters.date).format('DD/MM/YYYY');
        }
        
        if (filters.startDate && filters.endDate) {
            const start = dayjs(filters.startDate).format('DD/MM/YYYY');
            const end = dayjs(filters.endDate).format('DD/MM/YYYY');
            return `${start} até ${end}`;
        }
        
        return 'Todos os períodos';
    }

    async generatePeriodReportPDF(type: ReportType, filters: any, userId: string): Promise<{ pdfBuffer: Buffer; report: any }> {
        const records = await this.create(type, filters);

        if (!records || records.length === 0) {
            throw new BadRequestException('Nenhum registro encontrado para gerar o relatório');
        }

        const html = this.generatePeriodReportHTML(type, records, filters);

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        try {
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });
            
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20mm',
                    right: '15mm',
                    bottom: '20mm',
                    left: '15mm'
                }
            });

            const uploadsDir = path.join(process.cwd(), 'uploads', 'reports');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            const reportTypeNames = {
                [ReportType.DAILY]: 'diario',
                [ReportType.WEEKLY]: 'semanal',
                [ReportType.MONTHLY]: 'mensal'
            };
            
            const filename = `relatorio-${reportTypeNames[type]}-${Date.now()}.pdf`;
            const filePath = path.join(uploadsDir, filename);
            fs.writeFileSync(filePath, pdfBuffer);

            const complianceStatus = this.calculateComplianceStatus(records);

            const period = this.getPeriodText(type, filters);
            const report = await this.prisma.report.create({
                data: {
                    type,
                    period,
                    userId,
                    fileUrl: `uploads/reports/${filename}`,
                    complianceStatus,
                }
            });

            return { pdfBuffer: Buffer.from(pdfBuffer), report };
        } finally {
            await browser.close();
        }
    }

    private generatePeriodReportHTML(type: ReportType, records: any[], filters: any): string {
        const reportTitle = {
            [ReportType.DAILY]: 'Relatório Diário de Temperatura',
            [ReportType.WEEKLY]: 'Relatório Semanal de Temperatura',
            [ReportType.MONTHLY]: 'Relatório Mensal de Temperatura',
            [ReportType.CONFORMITY]: 'Relatório de Conformidade'
        };

        const periodText = this.getPeriodText(type, filters);
        const generatedDate = dayjs().format('DD/MM/YYYY [às] HH:mm');

        const totalRecords = records.length;
        const recordsWithAlerts = records.filter(r => r.alert).length;
        const criticalAlerts = records.filter(r => r.alert?.danger === AlertDanger.CRITICAL).length;
        const resolvedAlerts = records.filter(r => r.alert?.resolved).length;

        const sortedRecords = [...records].sort((a, b) => {
            const sectorA = a.food?.sector?.name || 'Zzz';
            const sectorB = b.food?.sector?.name || 'Zzz';
            const sectorCompare = sectorA.localeCompare(sectorB);
            
            if (sectorCompare !== 0) {
                return sectorCompare;
            }
            
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });

        const recordsHTML = sortedRecords.map(record => {
            const hasAlert = !!record.alert;
            const alertStatus = hasAlert 
                // ? (record.alert.resolved ? 'Resolvido' : record.alert.danger === AlertDanger.CRITICAL ? 'Crítico' : 'Alerta')
                // : 'Normal';
                ? record.alert.danger === AlertDanger.CRITICAL ? record.alert?.resolved ? 'Crítico - Resolvido' : 'Crítico - Pendente' : record.alert?.resolved ? 'Alerta - Resolvido' : 'Alerta - Pendente'
                : 'Normal';
            
            const rowClass = hasAlert 
                ? (record.alert?.danger === AlertDanger.CRITICAL ? 'critical-row' : 'alert-row')
                : '';

            return `
                <tr class="${rowClass}">
                    <td>${dayjs(record.createdAt).format('DD/MM HH:mm')}</td>
                    <td>${record.food?.sector?.name || 'N/A'}</td>
                    <td>${record.food?.name || 'N/A'}</td>
                    <td>${record.temperature.toFixed(1)}°C</td>
                    <td>${alertStatus}</td>
                    <td>${record.user?.name || 'N/A'}</td>
                    <td>${record.alert?.correctiveAction || 'N/A'}</td>
                </tr>
            `;
        }).join('');

        return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${reportTitle[type]}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #333;
            line-height: 1.6;
            background: #fff;
            font-size: 10pt;
        }
        
        .header {
            background: #2F80ED;
            color: white;
            padding: 20px;
            text-align: center;
            margin-bottom: 20px;
        }
        
        .header h1 {
            font-size: 20px;
            margin-bottom: 8px;
        }
        
        .header p {
            font-size: 11px;
            opacity: 0.9;
        }
        
        .info-section {
            background: #f8f9fa;
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 20px;
            border-left: 4px solid #2F80ED;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 5px 0;
            font-size: 10pt;
        }
        
        .info-label {
            font-weight: 600;
            color: #555;
        }
        
        .statistics {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 20px;
        }
        
        .stat-card {
            background: #fff;
            border: 2px solid #e0e0e0;
            border-radius: 6px;
            padding: 12px;
            text-align: center;
        }
        
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #2F80ED;
            margin-bottom: 4px;
        }
        
        .stat-label {
            font-size: 9pt;
            color: #666;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 9pt;
        }
        
        thead {
            background-color: #2F80ED;
            color: white;
        }
        
        th {
            padding: 10px 6px;
            text-align: left;
            font-weight: 600;
            border: 1px solid #2F80ED;
        }
        
        td {
            padding: 8px 6px;
            border: 1px solid #ddd;
        }
        
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        
        tr.alert-row {
            background-color: #fff3cd !important;
        }
        
        tr.critical-row {
            background-color: #f8d7da !important;
        }
        
        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 2px solid #e0e0e0;
            text-align: center;
            font-size: 9pt;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${reportTitle[type]}</h1>
        <p>Sistema de Controle de Temperatura</p>
    </div>
    
    <div class="info-section">
        <div class="info-row">
            <span class="info-label">Período:</span>
            <span class="info-value">${periodText}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Data de Geração:</span>
            <span class="info-value">${generatedDate}</span>
        </div>
    </div>
    
    <div class="statistics">
        <div class="stat-card">
            <div class="stat-value">${totalRecords}</div>
            <div class="stat-label">Total de Registros</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${recordsWithAlerts}</div>
            <div class="stat-label">Com Alertas</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${criticalAlerts}</div>
            <div class="stat-label">Críticos</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${resolvedAlerts}</div>
            <div class="stat-label">Resolvidos</div>
        </div>
    </div>
    
    <table>
        <thead>
            <tr>
                <th>Data/Hora</th>
                <th>Setor</th>
                <th>Alimento</th>
                <th>Temperatura</th>
                <th>Status</th>
                <th>Responsável</th>
                <th>Ação Corretiva</th>
            </tr>
        </thead>
        <tbody>
            ${recordsHTML}
        </tbody>
    </table>
    
    <div class="footer">
        <p>Este documento foi gerado automaticamente pelo Sistema de Controle de Temperatura.</p>
        <p>Documento confidencial - uso interno apenas.</p>
    </div>
</body>
</html>
        `;
    }

    private getPeriodText(type: ReportType, filters: any): string {
        switch (type) {
            case ReportType.DAILY:
                return filters.date 
                    ? dayjs(filters.date).format('DD/MM/YYYY')
                    : dayjs().format('DD/MM/YYYY');
            
            case ReportType.WEEKLY:
                const weekDate = filters.week ? dayjs(filters.week) : dayjs();
                const startOfWeek = weekDate.startOf('week').format('DD/MM/YYYY');
                const endOfWeek = weekDate.endOf('week').format('DD/MM/YYYY');
                return `${startOfWeek} até ${endOfWeek}`;
            
            case ReportType.MONTHLY:
                const monthDate = filters.month ? dayjs(filters.month) : dayjs();
                return monthDate.format('MMMM [de] YYYY');
            
            default:
                return 'N/A';
        }
    }

    async listReports(userId: string): Promise<any[]> {
        return this.prisma.report.findMany({
            where: { userId },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    async getReportById(id: string): Promise<any> {
        const report = await this.prisma.report.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    }
                }
            }
        });

        if (!report) {
            throw new BadRequestException('Relatório não encontrado');
        }

        return report;
    }
}
