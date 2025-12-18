import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportType } from '@prisma/client';

import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/pt-br';

const Dayjs = (dayjs as any).default || dayjs;
const utcPlugin = (utc as any).default || utc;
const timezonePlugin = (timezone as any).default || timezone;

Dayjs.extend(utcPlugin);
Dayjs.extend(timezonePlugin);

Dayjs.locale('pt-br');
Dayjs.tz.setDefault('America/Sao_Paulo');

@Injectable()
export class ReportsService {
    constructor(private readonly prisma: PrismaService) {}

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

    private getDayBoundaries(date?: string | Date): { startOfDay: Date; endOfDay: Date } {
        const targetDate = date ? Dayjs(date) : Dayjs();

        if (!targetDate.isValid()) {
            throw new BadRequestException('Data inválida');
        }

        const startOfDay = targetDate.startOf('day').toDate();
        const endOfDay = targetDate.endOf('day').toDate();

        return { startOfDay, endOfDay };
    }

    private getWeekBoundaries(date?: string | Date): { startOfWeek: Date; endOfWeek: Date } {
        const targetDate = date ? Dayjs(date) : Dayjs();

        if (!targetDate.isValid()) {
            throw new BadRequestException('Data inválida');
        }

        const startOfWeek = targetDate.startOf('week').toDate();
        const endOfWeek = targetDate.endOf('week').toDate();

        return { startOfWeek, endOfWeek };
    }

}
