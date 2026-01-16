import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Alert, AlertDanger } from '@prisma/client';
import { ResolveAlertDto } from './dto/resolve-alert.dto';
import { getDayBoundaries } from 'src/common/utils/date.utils';
import dayjs from 'dayjs';

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

        return this.prisma.alert.update({ where: { id }, data: { resolved: true, correctiveAction: dto.correctiveAction, resolvedBy: { connect: { id: userId } }, resolvedAt: new Date() } });
    }
}
