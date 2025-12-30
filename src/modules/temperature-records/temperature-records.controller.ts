import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CreateTemperatureRecordsDto } from './dto/create-temperature-records.dto';
import { TemperatureRecordsService } from './temperature-records.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { User } from 'src/common/decorators/user.decorator';

@Controller('temperature-records')
export class TemperatureRecordsController {
    constructor(private readonly temperatureRecordsService: TemperatureRecordsService) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() dto: CreateTemperatureRecordsDto, @User() user: { userId: string }) {
        return this.temperatureRecordsService.create(dto, user.userId);
    }
}

