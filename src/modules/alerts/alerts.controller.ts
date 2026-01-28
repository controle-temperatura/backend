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
    @Roles(Role.ADMIN, Role.AUDITOR)
    @Get()
    findAll(@Query() filters: any) {
        return this.alertsService.findAll(filters);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.AUDITOR)
    @Get('tables')
    getForTable(@Query('date') date: any, @Query('page') page: string, @Query('limit') limit: string) {
        return this.alertsService.getForTable(date, page, limit);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.AUDITOR)
    @Get('corrections')
    getCorrections(@Query('date') date: any, @Query('page') page: string, @Query('limit') limit: string) {
        return this.alertsService.getCorrections(date, page, limit);
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
