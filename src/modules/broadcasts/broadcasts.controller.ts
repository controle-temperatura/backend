import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { BroadcastsService } from './broadcasts.service';
import { Roles } from 'src/common/decorators/role.decorator';
import { Role } from '@prisma/client';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { CreateBroadcastDto } from './dto/create-broadcast.dto';

@Controller('broadcasts')
export class BroadcastsController {
    constructor(private readonly broadcastsService: BroadcastsService) {}

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.SUPER_ADMIN)
    @Post()
    createBroadcast(@Body() createBroadcastDto: CreateBroadcastDto) {
        return this.broadcastsService.createBroadcast(createBroadcastDto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.SUPER_ADMIN)
    @Get()
    getBroadcasts() {
        return this.broadcastsService.getBroadcasts();
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.SUPER_ADMIN)
    @Get('recievers')
    getBroadcastsByCompany() {
        console.log('getRecievers');
        return this.broadcastsService.getRecievers();
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.SUPER_ADMIN)
    @Get(':id')
    getBroadcast(@Param('id') id: string) {
        return this.broadcastsService.getBroadcast(id);
    }
}
