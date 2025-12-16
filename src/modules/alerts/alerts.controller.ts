import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { ResolveAlertDto } from './dto/resolve-alert.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { User } from 'src/common/decorators/user.decorator';

@Controller('alerts')
export class AlertsController {
    constructor(private readonly alertsService: AlertsService) {}

    @Get()
    findAll(@Query('resolved') resolved?: boolean) {
        if (resolved === true) {
            return this.alertsService.getResolvedAlerts();
        } else if (resolved === false) {
            return this.alertsService.getUnresolvedAlerts();
        }
        return this.alertsService.findAll();
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
