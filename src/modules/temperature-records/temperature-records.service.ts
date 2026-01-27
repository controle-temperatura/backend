import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemperatureRecordsDto } from './dto/create-temperature-records.dto';
import { AlertDanger, AlertType, Food, TemperatureRecord } from '@prisma/client';
import { getDayBoundaries } from 'src/common/utils/date.utils';
import Dayjs from 'src/common/utils/dayjs.config';

type TemperatureAlert = { type: AlertType; danger: AlertDanger };

@Injectable()   
export class TemperatureRecordsService {
    constructor(private readonly prisma: PrismaService) {}

    private async calcTemperatureErrorMargin(food: Food): Promise<number> {
        const temperatureDiff = food.tempMax - food.tempMin;
        const errorMargin = temperatureDiff * 0.3;

        return errorMargin;
    }

    private async createTemperatureAlert( food: Food, temperature: number, ): Promise<TemperatureAlert | undefined> {
        const temperatureErrorMargin = await this.calcTemperatureErrorMargin(food);

        let alertData: TemperatureAlert | undefined = undefined;

        if (temperature < food.tempMin) {
            alertData = { type: AlertType.BELOW_MIN, danger: AlertDanger.CRITICAL };
        }

        else if (temperature > food.tempMax) {
            alertData = { type: AlertType.ABOVE_MAX, danger: AlertDanger.CRITICAL };
        }

        else if (temperature < food.tempMin + temperatureErrorMargin) {
            alertData = { type: AlertType.NEXT_MIN, danger: AlertDanger.ALERT };
        }

        else if (temperature > food.tempMax - temperatureErrorMargin) {
            alertData = { type: AlertType.NEXT_MAX, danger: AlertDanger.ALERT };
        }

        return alertData;
    }

    async create(dto: CreateTemperatureRecordsDto, userId: string): Promise<TemperatureRecord> {
        const food = await this.prisma.food.findUnique({ where: { id: dto.foodId } });
        if (!food) throw new NotFoundException('Alimento não encontrado');

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('Usuário não encontrado');
        
        return this.prisma.$transaction(async (tx) => {
            const newTemperatureRecord = await tx.temperatureRecord.create({
                data: {
                    foodId: dto.foodId,
                    userId,
                    temperature: dto.temperature,
                },
            });

            const rawAlert = await this.createTemperatureAlert(food, dto.temperature);

            if (rawAlert) {
                await tx.alert.create({
                    data: {
                        ...rawAlert,
                        temperatureRecordId: newTemperatureRecord.id,
                    },
                });
            }

            return newTemperatureRecord;
        })
    }

    async findAll(userId: string, date: string): Promise<TemperatureRecord[]> {
        const { startOfDay, endOfDay } = getDayBoundaries(date);
        
        return this.prisma.temperatureRecord.findMany({
            where: { userId, createdAt: { gte: startOfDay, lte: endOfDay } },
        });
    }

    async getForTable(filters: any): Promise<any> {
        const { page, limit, ...searchFilters } = filters

        const pageNumber = parseInt(page) || 1;
        const skip = (pageNumber - 1) * Number(limit) as number;

        const formattedFilters = await this.formatFilters(searchFilters);

        const where: any = {};
        Object.assign(where, formattedFilters);

        const totalRecords = await this.prisma.temperatureRecord.count({ where });

        const data = await this.prisma.temperatureRecord.findMany({
            where,
            select: {
                id: true,
                food: { select: { name: true, sector: { select: { name: true }}}},
                user: { select: { name: true }},
                temperature: true,
                alert: { select: { danger: true }},
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: Number(limit) as number,
        });

        const formattedData = data.map(record => {

            const hasAlert = !!record.alert;
            const status = hasAlert ? (record.alert?.danger === AlertDanger.CRITICAL ? 'Crítico' : 'Alerta') : 'Ok';
            
            return {
                food: record.food.name,
                sector: record.food.sector.name,
                user: record.user?.name,
                temperature: record.temperature,
                status,
                createdAt: Dayjs(record.createdAt).format('DD/MM HH:mm'),
            }
        })

        return {
            data: formattedData,
            pagination: {
                page: pageNumber,
                limit: Number(limit) as number,
                totalRecords,
                totalPages: Math.ceil(totalRecords / Number(limit) as number),
            }
        };
    }

    private async formatFilters(filters: any): Promise<any> {

        const formattedFilters: any = {};
        if (filters.date) {
            const { startOfDay, endOfDay } = getDayBoundaries(filters.date);
            formattedFilters.createdAt = { gte: startOfDay, lte: endOfDay };
        }
        if (filters.sectorId) {
            formattedFilters.food = { sectorId: filters.sectorId };
        }
        if (filters.foodId) {
            formattedFilters.food = { id: filters.foodId };
        }
        if (filters.alertType) {
            formattedFilters.alert = { type: filters.alertType };
        }
        if (filters.danger) {
            formattedFilters.alert = { danger: filters.danger };
        }

        return formattedFilters;
    }
}

/* 
{
  date: '2026-01-23',
  sectorId: '66032b40-e54e-46ba-9314-cdd373472e1c',
  foodId: '2214ec50-9da8-4fac-95d1-a579e965a07a',
  alertType: 'ABOVE_MAX',
  danger: 'CRITICAL'
}
*/