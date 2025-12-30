import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AlertDanger, AlertType, ComplianceStatus, ReportType } from '@prisma/client';
import dayjs from '../../common/utils/dayjs.config';

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
        // fazer o código para gerar o relatório
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
                        }
                    }
                },
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

    private async createConformityReportContent(records: any[]): Promise<string> {
        let content = 'ALERTAS CRÍTICOS:\n\n';

        const criticalRecordsContent = records.filter(record => record.alert?.danger === AlertDanger.CRITICAL).map(record => {
            return `${record.food?.name} registrou temperatura ${record.temperature} °C, o que está ${this.formatAlertType(record.alert?.type)}. ${record.alert?.resolved ? `Foi resolvido com ação corretiva: ${record.alert?.correctiveAction}` : 'Não foi resolvido'}`;
        }).join('\n');

        content += criticalRecordsContent;
        content += '\n\nALERTAS NÃO CRÍTICOS:\n\n';

        const nonCriticalRecordsContent = records.filter(record => record.alert?.danger === AlertDanger.ALERT).map(record => {
            return `${record.food?.name} registrou temperatura ${record.temperature} °C, o que está ${this.formatAlertType(record.alert?.type)}. ${record.alert?.resolved ? `Foi resolvido com ação corretiva: ${record.alert?.correctiveAction}` : 'Não é necessário ação corretiva'}`;
        }).join('\n');
        
        content += nonCriticalRecordsContent;

        return content;
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
}
