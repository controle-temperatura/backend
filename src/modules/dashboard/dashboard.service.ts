import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getDayBoundaries } from 'src/common/utils/date.utils';
import { AlertDanger, ReportType } from '@prisma/client';
import Dayjs from 'src/common/utils/dayjs.config';


@Injectable()
export class DashboardService {
    constructor(private readonly prisma: PrismaService) {}

    async getDashboard(date: string) {
        const { startOfDay, endOfDay } = getDayBoundaries(date);

        const records = await this.prisma.temperatureRecord.findMany({
            where: { createdAt: { gte: startOfDay, lte: endOfDay } },
        });

        const alerts = await this.prisma.alert.findMany({
            where: { temperatureRecord: { createdAt: { gte: startOfDay, lte: endOfDay } } },
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
                temperatureRecord: {
                    select: {
                        food: {
                            select: {
                                sector: {
                                    select: {
                                        id: true,
                                        name: true,
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })

        const data = { records, alerts }
        return data;
    }

    async getForReports(tablePage: string, tableLimit: string) {
        const pageNumber = parseInt(tablePage) || 1;
        const skip = (pageNumber - 1) * Number(tableLimit) as number;

        const totalReports = await this.prisma.report.count();

        const reports = await this.prisma.report.findMany({
            skip,
            take: Number(tableLimit) as number,
            select: {
                type: true,
                period: true,
                createdAt: true,
                user: { select: { name: true}},
                id: true,
                fileUrl: true,
            }
        });

        const totalRecords = await this.prisma.temperatureRecord.count();
        const totalCriticalAlerts = await this.prisma.alert.count({
            where: { danger: AlertDanger.CRITICAL }
        });
        const totalCorrectiveActions = await this.prisma.alert.count({
            where: { correctiveAction: { not: null } }
        });
        
        const conformityRate = ((totalRecords - totalCriticalAlerts) / totalRecords) * 100;

        const recordsDataTitles = {
            conformityRate: 'Taxa de Conformidade',
            totalRecords: 'Total de Registros',
            totalCriticalAlerts: 'Total de Alertas Críticos',
            totalCorrectiveActions: 'Total de Ações Corretivas'
        }

        const RawRecordsData = {
            conformityRate: conformityRate.toFixed(1) + '%',
            totalRecords: totalRecords,
            totalCriticalAlerts: totalCriticalAlerts,
            totalCorrectiveActions: totalCorrectiveActions
        
        }

        const recordsData = Object.entries(RawRecordsData).map(([key, value]) => ({
            title: recordsDataTitles[key as keyof typeof recordsDataTitles],
            value: value,
            type: key
        }))


        const reportTypesLabels = {
            [ReportType.DAILY]: 'Diário',
            [ReportType.WEEKLY]: 'Semanal',
            [ReportType.MONTHLY]: 'Mensal',
            [ReportType.CONFORMITY]: 'Conformidade',
            [ReportType.CUSTOM]: 'Customizado'
        }

        const reportTypesDescriptions = {
            [ReportType.DAILY]: 'Gerar um relatório diário com dados de temperatura e sanitização',
            [ReportType.WEEKLY]: 'Gerar um relatório semanal com dados de temperatura e sanitização',
            [ReportType.MONTHLY]: 'Gerar um relatório mensal com dados de temperatura e sanitização',
            [ReportType.CONFORMITY]: 'Gerar um relatório de status de conformidade com o APPCC e pontos críticos',
            [ReportType.CUSTOM]: 'Gerar um relatório customizado com os parâmetros desejados'
        }

        const reportTypes = Object.values(ReportType).map(type => ({ id: type, label: reportTypesLabels[type], description: reportTypesDescriptions[type] }));

        const formattedReports = reports.map(report => ({
            id: report.id,
            type: report.type,
            period: report.period,
            user: report.user.name,
            fileUrl: report.fileUrl,
            createdAt: Dayjs(report.createdAt).format('DD/MM HH:mm'),
        }))

        const data = { 
            reports: formattedReports, 
            recordsData, 
            reportTypes,
            pagination: {
                page: pageNumber,
                limit: Number(tableLimit) as number,
                totalRecords: totalReports,
                totalPages: Math.ceil(totalReports / Number(tableLimit) as number),
            }
        }

        return data;
    }

    async getAlerts(date: string) {
        const { startOfDay, endOfDay } = getDayBoundaries(date);

        const alerts = await this.prisma.alert.findMany({
            where: { createdAt: { gte: startOfDay, lte: endOfDay } },
            select: {
                danger: true,
                resolved: true,
                temperatureRecord: {
                    select: {
                        food: {
                            select: { name: true}
                        },
                        temperature: true
                    }
                }
            }
        });

        const groupedAlerts: any = [ 
            {
                title: "CRÍTICO - Fora do padrão",
                description: "Necessário correção imediata",
                data: [],
                type: "CRITICAL"
            }, 
            {
                title: "ALERTA - Perto do limite",
                description: "Necessário atenção",
                data: [],
                type: "ALERT"
            }, 
            {
                title: "RESOLVIDO - Problema resolvido",
                description: "Problemas já resolvidos",
                data: [],
                type: "RESOLVED"
            }, 
            {
                title: "PENDENTE - Ações Pendentes",
                description: "Ações ainda pendentes",
                data: [],
                type: "PENDING"
            } 
        ]
        
        alerts.forEach(alert => {
            if (alert.danger === AlertDanger.CRITICAL) {
                const criticalAlert = groupedAlerts.find(alert => alert.type === "CRITICAL");
                criticalAlert?.data.push({ key: alert.temperatureRecord?.food.name, value: alert.temperatureRecord?.temperature.toFixed(1) + '°C' });
            } else if (alert.danger === AlertDanger.ALERT) {
                const alertAlert = groupedAlerts.find(alert => alert.type === "ALERT");
                alertAlert?.data.push({ key: alert.temperatureRecord?.food.name, value: alert.temperatureRecord?.temperature.toFixed(1) + '°C' });
            } else if (alert.resolved) {
                const resolvedAlert = groupedAlerts.find(alert => alert.type === "RESOLVED");
                resolvedAlert?.data.push({ key: alert.temperatureRecord?.food.name, value: alert.temperatureRecord?.temperature.toFixed(1) + '°C' });
            } 
        });

        return groupedAlerts;
    }
}
