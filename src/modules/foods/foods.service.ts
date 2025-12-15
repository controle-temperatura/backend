import { Injectable, NotFoundException } from '@nestjs/common';
import { Food, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFoodDto } from './dto/create-food.dto';
import { UpdateFoodDto } from './dto/update-food.dto';

@Injectable()
export class FoodsService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateFoodDto): Promise<Food> {
        return this.prisma.food.create({
            data: {
                name: dto.name,
                tempMin: dto.tempMin,
                tempMax: dto.tempMax,
                sector: { connect: { id: dto.sectorId } },
            },
        });
    }

    async findAll(): Promise<Food[]> {
        return this.prisma.food.findMany();
    }

    async findOne(id: string): Promise<Food> {
        const food = await this.prisma.food.findUnique({ where: { id } });

        if (!food) throw new NotFoundException('Alimento não encontrado');

        return food;
    }

    async update(id: string, dto: UpdateFoodDto): Promise<Food> {
        const data: Prisma.FoodUpdateInput = {};

        if (dto.name !== undefined) data.name = dto.name;
        if (dto.tempMin !== undefined) data.tempMin = dto.tempMin;
        if (dto.tempMax !== undefined) data.tempMax = dto.tempMax;
        if (dto.sectorId !== undefined) {
            data.sector = { connect: { id: dto.sectorId } };
        }

        try {
            return await this.prisma.food.update({
                where: { id },
                data,
            });
        } catch (error) {
            if ( error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025' ) {
                throw new NotFoundException('Alimento não encontrado');
            }

            throw error;
        }
    }

    async remove(id: string): Promise<Food> {
        try {
            return await this.prisma.food.delete({ where: { id } });
        } catch (error) {
            if ( error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025' ) {
                throw new NotFoundException('Alimento não encontrado');
            }

            throw error;
        }
    }
}

