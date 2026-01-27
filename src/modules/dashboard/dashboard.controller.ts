import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { User } from 'src/common/decorators/user.decorator';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { Roles } from 'src/common/decorators/role.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Role } from '@prisma/client';

@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) {}

    @UseGuards(JwtAuthGuard)
    @Get()
    getDashboard(@Query('date') date: string) {
        return this.dashboardService.getDashboard(date);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.AUDITOR)
    @Get('reports')
    getReports(@Query('tablePage') tablePage: string, @Query('tableLimit') tableLimit: string) {
        return this.dashboardService.getForReports(tablePage, tableLimit);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.AUDITOR)
    @Get('alerts')
    getAlerts(@Query('date') date: string) {
        return this.dashboardService.getAlerts(date);
    }
}
