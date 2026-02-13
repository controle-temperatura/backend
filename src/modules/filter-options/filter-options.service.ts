import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AlertDanger, AlertType } from '@prisma/client';

@Injectable()
export class FilterOptionsService {
    constructor(private readonly prisma: PrismaService) {}

    async getTableOptions() {
        const sectors = await this.prisma.sector.findMany(
            { select: { id: true, name: true } }
        );

        const foods = await this.prisma.food.findMany(
            { select: { id: true, name: true, sector: { select: { id: true }}}}
        );

        const alertDangers = Object.values(AlertDanger).map(danger => ({ value: danger, label: danger }));
        const alertTypes = Object.values(AlertType).map(type => ({ value: type, label: type }));

        return { sectors, foods, alertDangers, alertTypes };
    }
}
