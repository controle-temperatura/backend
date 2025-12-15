import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
} from '@nestjs/common';
import { CreateFoodDto } from './dto/create-food.dto';
import { UpdateFoodDto } from './dto/update-food.dto';
import { FoodsService } from './foods.service';

@Controller('foods')
export class FoodsController {
    constructor(private readonly foodsService: FoodsService) {}

    @Post()
    create(@Body() dto: CreateFoodDto) {
        return this.foodsService.create(dto);
    }

    @Get()
    findAll() {
        return this.foodsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.foodsService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateFoodDto) {
        return this.foodsService.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.foodsService.remove(id);
    }
}

