import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { ResolveAlertDto } from './dto/resolve-alert.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { User } from 'src/common/decorators/user.decorator';
import { AlertDanger, Role } from '@prisma/client';
import { Roles } from 'src/common/decorators/role.decorator';

interface QueryFilters {
    resolved?: boolean;
    danger?: AlertDanger;
    sectorId?: string;
}

@Controller('alerts')
export class AlertsController {
    constructor(private readonly alertsService: AlertsService) {}

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Get()
    findAll(@Query() filters: QueryFilters) {
        return this.alertsService.findAll(filters);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.alertsService.findOne(id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/resolve')
    resolve(@Param('id') id: string, @Body() dto: ResolveAlertDto, @User() user: { userId: string }) {
        return this.alertsService.resolve(id, dto, user.userId);
    }
}
