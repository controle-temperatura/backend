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

    async findAll(filters: any): Promise<any> {
        const { page, limit, ...searchFilters } = filters;

        const pageNumber = parseInt(page) || 1;
        const skip = (pageNumber - 1) * Number(limit) as number;

        const totalCount = await this.prisma.food.count();
        const activeCount = await this.prisma.food.count({ where: { active: true } });
        const sectorsCount = await this.prisma.sector.count();


        const foods = await this.prisma.food.findMany({
            where: {
                ...searchFilters,
            },
            skip,
            take: Number(limit) as number,
            include: {
                sector: {
                    select: { name: true }
                }
            },
        });

        const formattedFoods = foods.map((food) => ({
            id: food.id,
            name: food.name,
            sector: food.sector.name,
            tempMin: `${food.tempMin}°C`,
            tempMax: `${food.tempMax}°C`,
            active: food.active,
        }))

        return {
            totalCount,
            activeCount,
            sectorsCount,
            foods: formattedFoods,
            pagination: {
                page: pageNumber,
                limit: Number(limit) as number,
                totalRecords: totalCount,
                totalPages: Math.ceil(totalCount / Number(limit) as number),
            }
        };
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

