import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Alert } from '@prisma/client';
import { ResolveAlertDto } from './dto/resolve-alert.dto';

@Injectable()
export class AlertsService {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(): Promise<Alert[]> {
        return this.prisma.alert.findMany();
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
