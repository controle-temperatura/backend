import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Alert, AlertDanger } from '@prisma/client';
import { ResolveAlertDto } from './dto/resolve-alert.dto';
import { getDayBoundaries } from 'src/common/utils/date.utils';
import dayjs from 'dayjs';
import Dayjs from 'src/common/utils/dayjs.config';

interface QueryFilters {
    resolved?: boolean | string;
    danger?: AlertDanger;
    sectorId?: string;
    date?: Date | string;
    startDate?: Date | string;
    endDate?: Date | string;
}

@Injectable()
export class AlertsService {
    constructor(private readonly prisma: PrismaService) {}

    private calcDeviation(temperature: any, tempMin: any, tempMax: any): number {
        const closest = Math.abs(temperature - tempMin) < Math.abs(temperature - tempMax) ? tempMin : tempMax;
        return temperature - closest;
    }

    async findAll(filters: QueryFilters): Promise<Alert[]> {

        const { resolved, danger, sectorId, date, startDate, endDate } = filters;

        const dbQueryFilters: any = {};

        if (date) {
            const { startOfDay, endOfDay } = getDayBoundaries(date);

            dbQueryFilters.createdAt = {
                gte: startOfDay,
                lte: endOfDay,
            };
        } else if (startDate && endDate) {
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

        return this.prisma.alert.findMany({ where: { ...dbQueryFilters, resolved: resolved && resolved === 'true', danger, temperatureRecord: { food: { sectorId: sectorId } } } });
    }

    async findOne(id: string): Promise<Alert> {
        const alert = await this.prisma.alert.findUnique({ where: { id } });

        if (!alert) throw new NotFoundException('Alerta não encontrado');

        return alert;
    }

    async getResolvedAlerts(): Promise<Alert[]> {
        return this.prisma.alert.findMany({ where: { resolved: true } });
    }

    async getUnresolvedAlerts(): Promise<Alert[]> {
        return this.prisma.alert.findMany({ where: { resolved: false } });
    }

    async resolve(id: string, dto: ResolveAlertDto, userId: string): Promise<Alert> {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('Usuário não encontrado');
        
        const alert = await this.prisma.alert.findUnique({ where: { id } });
        if (!alert) throw new NotFoundException('Alerta não encontrado');

        return this.prisma.alert.update({ where: { id }, data: { resolved: true, correctiveAction: dto.correctiveAction, correctedTemperature: dto.correctedTemperature, resolvedBy: { connect: { id: userId } }, resolvedAt: new Date() } });
    }

    async getCorrections(date: any, page: string, limit: string): Promise<any> {

        const { startOfDay, endOfDay } = getDayBoundaries(date);

        const pageNumber = parseInt(page) || 1;
        const skip = (pageNumber - 1) * Number(limit) as number;

        const total = await this.prisma.alert.count({ where: { correctiveAction: { not: null }, createdAt: { gte: startOfDay, lte: endOfDay } } });

        const correctedAlerts = await this.prisma.alert.findMany({ 
            where: { correctiveAction: { not: null }, createdAt: { gte: startOfDay, lte: endOfDay } },
            skip,
            take: Number(limit) as number,
            select: {
                id: true,
                temperatureRecord: {
                    select: {
                        food: {
                            select: {
                                name: true,
                                sector: { select: { name: true }}
                            }
                        },
                        createdAt: true,
                        temperature: true
                    }
                },
                correctiveAction: true,
                correctedTemperature: true,
                resolvedBy: { select: { name: true} },
                createdAt: true
            }
        });

        const formattedAlerts = correctedAlerts.map(alert => ({
            id: alert.id,
            food: alert.temperatureRecord?.food.name,
            sector: alert.temperatureRecord?.food.sector.name,
            temperature: `${alert.temperatureRecord?.temperature.toFixed(1)}°C`,
            correctedTemperature: `${alert.correctedTemperature?.toFixed(1)}°C`,
            correctedBy: alert.resolvedBy?.name,
            correctedAt: Dayjs(alert.createdAt).format('DD/MM HH:mm'),
        }))

        return {
            data: formattedAlerts,
            pagination: {
                page: pageNumber,
                limit: Number(limit) as number,
                total,
                totalPages: Math.ceil(total / Number(limit) as number),
            }
        };
    }

    async getForTable(date: any, page: string, limit: string): Promise<any> {
        const { startOfDay, endOfDay } = getDayBoundaries(date);
        
        const pageNumber = parseInt(page) || 1;
        const skip = (pageNumber - 1) * Number(limit) as number;

        const total = await this.prisma.alert.count({ where: { resolved: false, createdAt: { gte: startOfDay, lte: endOfDay } } });

        const pendingAlerts = await this.prisma.alert.findMany({
            where: { resolved: false, createdAt: { gte: startOfDay, lte: endOfDay } },
            skip,
            take: Number(limit) as number,
            select: {
                id: true,
                temperatureRecord: {
                    select: {
                        temperature: true,
                        createdAt: true,
                        food: {
                            select: { 
                                name: true, 
                                tempMin: true,
                                tempMax: true,
                                sector: { select: { name: true}
                            }}
                        }
                    },
                },
            }
        })

        const formattedAlerts = pendingAlerts.map(alert => ({
            id: alert.id,
            food: alert.temperatureRecord?.food.name,
            sector: alert.temperatureRecord?.food.sector.name,
            temperature: `${alert.temperatureRecord?.temperature.toFixed(1)}°C`,
            createdAt: Dayjs(alert.temperatureRecord?.createdAt).format('DD/MM HH:mm'),
            defaultInterval: `${alert.temperatureRecord?.food.tempMin}°C - ${alert.temperatureRecord?.food.tempMax}°C`,
            deviation: `${this.calcDeviation(alert.temperatureRecord?.temperature , alert.temperatureRecord?.food.tempMin, alert.temperatureRecord?.food.tempMax).toFixed(1)}°C`,
        }))

        return {
            data: formattedAlerts,
            pagination: {
                page: pageNumber,
                limit: Number(limit) as number,
                total,
                totalPages: Math.ceil(total / Number(limit) as number),
            }
        };
    }
}
