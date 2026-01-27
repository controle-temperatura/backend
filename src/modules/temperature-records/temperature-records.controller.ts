import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CreateTemperatureRecordsDto } from './dto/create-temperature-records.dto';
import { TemperatureRecordsService } from './temperature-records.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { User } from 'src/common/decorators/user.decorator';
import { Role } from '@prisma/client';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/role.decorator';

@Controller('temperature-records')
export class TemperatureRecordsController {
    constructor(private readonly temperatureRecordsService: TemperatureRecordsService) {}

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.COLABORATOR)
    @Post()
    create(@Body() dto: CreateTemperatureRecordsDto, @User() user: { userId: string }) {
        return this.temperatureRecordsService.create(dto, user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(@User() user: { userId: string }, @Query('date') date: string) {
        return this.temperatureRecordsService.findAll(user.userId, date);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.AUDITOR)
    @Get('tables')
    getForTable(@Query() filters: any) {
        return this.temperatureRecordsService.getForTable(filters);
    }
}

