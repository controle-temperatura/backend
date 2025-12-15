import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CreateTemperatureRecordDto } from './dto/create-temperature-record.dto';
import { TemperatureRecordService } from './temperature-record.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { User } from 'src/common/decorators/user.decorator';

@Controller('temperature-records')
export class TemperatureRecordController {
    constructor(private readonly temperatureRecordService: TemperatureRecordService) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() dto: CreateTemperatureRecordDto, @User() user: { userId: string }) {
        return this.temperatureRecordService.create(dto, user.userId);
    }
}
