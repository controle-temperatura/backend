import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { CreateSectorDto } from './dto/create-sector.dto';
import { UpdateSectorDto } from './dto/update-sector.dto';
import { SectorsService } from './sectors.service';
import { Role } from '@prisma/client';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/role.decorator';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';

@Controller('sectors')
export class SectorsController {
    constructor(private readonly sectorsService: SectorsService) {}

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Post()
    create(@Body() dto: CreateSectorDto) {
        return this.sectorsService.create(dto);
    }

    @Get()
    findAll(@Query() filters: any) {
        return this.sectorsService.findAll(filters);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Get('filters')
    getForTable() {
        return this.sectorsService.getForFilters();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.sectorsService.findOne(id);
    }

    @Get(':id/foods')
    getFoods(@Param('id') id: string) {
        return this.sectorsService.getFoods(id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateSectorDto) {
        return this.sectorsService.update(id, dto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.sectorsService.remove(id);
    }
}

