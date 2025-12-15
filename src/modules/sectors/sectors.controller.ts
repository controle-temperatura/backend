import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
} from '@nestjs/common';
import { CreateSectorDto } from './dto/create-sector.dto';
import { UpdateSectorDto } from './dto/update-sector.dto';
import { SectorsService } from './sectors.service';

@Controller('sectors')
export class SectorsController {
    constructor(private readonly sectorsService: SectorsService) {}

    @Post()
    create(@Body() dto: CreateSectorDto) {
        return this.sectorsService.create(dto);
    }

    @Get()
    findAll() {
        return this.sectorsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.sectorsService.findOne(id);
    }

    @Get(':id/foods')
    getFoods(@Param('id') id: string) {
        return this.sectorsService.getFoods(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateSectorDto) {
        return this.sectorsService.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.sectorsService.remove(id);
    }
}

