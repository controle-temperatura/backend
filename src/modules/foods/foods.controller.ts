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
import { CreateFoodDto } from './dto/create-food.dto';
import { UpdateFoodDto } from './dto/update-food.dto';
import { FoodsService } from './foods.service';
import { Role } from '@prisma/client';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/role.decorator';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';

@Controller('foods')
export class FoodsController {
    constructor(private readonly foodsService: FoodsService) {}

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.COLABORATOR)
    @Post()
    create(@Body() dto: CreateFoodDto) {
        return this.foodsService.create(dto);
    }

    @Get()
    findAll(@Query() filters: any) {
        return this.foodsService.findAll(filters);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.foodsService.findOne(id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.COLABORATOR)
    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateFoodDto) {
        return this.foodsService.update(id, dto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.foodsService.remove(id);
    }
}

