import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportType } from '@prisma/client';
import dayjs from '../../common/utils/dayjs.config';

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

        else if (type === ReportType.MONTHLY) {
            const { startOfMonth, endOfMonth } = this.getMonthBoundaries(filters.month);
            dbQueryFilters.createdAt = {
                gte: startOfMonth,
                lte: endOfMonth,
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
}
