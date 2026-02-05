import { Injectable, NotFoundException } from '@nestjs/common';
import { Food, Prisma, Sector } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSectorDto } from './dto/create-sector.dto';
import { UpdateSectorDto } from './dto/update-sector.dto';

@Injectable()
export class SectorsService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateSectorDto): Promise<Sector> {
        return this.prisma.sector.create({
            data: { ...dto, active: dto.active ?? true },
        });
    }

    async findAll(filters: any): Promise<any> {
        const { page, limit, ...searchFilters } = filters;

        if (searchFilters.active) searchFilters.active = searchFilters.active === 'true';

        const pageNumber = parseInt(page) || 1;
        const skip = (pageNumber - 1) * Number(limit) as number;

        const totalCount = await this.prisma.sector.count();
        const totalRecords = await this.prisma.sector.count({ where: { ...searchFilters } });
        const activeCount = await this.prisma.sector.count({ where: { active: true } });
        
        const responsibleUsers = await this.prisma.sector.groupBy({
            by: ['responsibleUserId'],
            where: { responsibleUserId: { not: null } },
        });
        const responsibleUsersCount = responsibleUsers.length;

        const sectors = await this.prisma.sector.findMany({
            where: { ...searchFilters },
            skip,
            take: Number(limit) as number,
            select: {
                id: true,
                name: true,
                measurementTimes: true,
                responsibleUser: { select: { name: true } },
                _count: { select: { foods: true } },
                active: true
            },
        });

        const formattedSectors = sectors.map((sector: any) => ({
            id: sector.id,
            name: sector.name,
            measurementTimes: sector.measurementTimes,
            responsibleUser: sector.responsibleUser?.name ?? null,
            foodsCount: sector._count.foods,
            active: sector.active
        }))

        return {
            sectors: formattedSectors,
            totalCount,
            totalRecords,
            activeCount,
            responsibleUsersCount,
            pagination: {
                page: pageNumber,
                limit: Number(limit) as number,
                totalRecords,
                totalPages: Math.ceil(totalRecords / Number(limit) as number)
            }
        };
    }

    async findAllActive(filters: any): Promise<any> {
        const { page, limit, ...searchFilters } = filters;
        const pageNumber = parseInt(page) || 1;
        const skip = (pageNumber - 1) * Number(limit) as number;

        const totalCount = await this.prisma.sector.count({ where: { active: true } });

        const sectors = await this.prisma.sector.findMany({ 
            where: { active: true }, 
            skip, 
            take: Number(limit) as number,
            select: {
                id: true,
                name: true,
                icon: true,
            }
        });

        return {
            sectors,
            pagination: {
                page: pageNumber,
                limit: Number(limit) as number,
                totalRecords: sectors.length,
                totalPages: Math.ceil(sectors.length / Number(limit) as number),
            }
        };
    }

    async findOne(id: string): Promise<Sector> {
        const sector = await this.prisma.sector.findUnique({ where: { id } });
        if (!sector) throw new NotFoundException('Setor não encontrado');
        return sector;
    }

    getForFilters(foodsCount: string): Promise<any[]> {
        const needsFoodsCount = foodsCount === 'true';
        if (needsFoodsCount) {
            return this.prisma.sector.findMany({ where: { active: true }, select: { id: true, name: true, _count: { select: { foods: true } } } });
        }
        return this.prisma.sector.findMany({ where: { active: true }, select: { id: true, name: true } });
    }

    async update(id: string, dto: UpdateSectorDto): Promise<Sector> {
        const data: Prisma.SectorUpdateInput = {};
        if (dto.name !== undefined) data.name = dto.name;
        if (dto.responsibleUserId !== undefined) {
            data.responsibleUser =
                dto.responsibleUserId === null
                    ? { disconnect: true }
                    : { connect: { id: dto.responsibleUserId } };
        }
        if (dto.active !== undefined) data.active = dto.active;
        if (dto.icon !== undefined) data.icon = dto.icon;
        if (dto.description !== undefined) data.description = dto.description;
        if (dto.measurementTimes !== undefined) data.measurementTimes = dto.measurementTimes;

        try {
            return await this.prisma.sector.update({ where: { id }, data });
        } catch (error) {
            if ( error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025' ) {
                throw new NotFoundException('Setor não encontrado');
            }
            throw error;
        }
    }

    async remove(id: string): Promise<Sector> {
        try {
            return await this.prisma.sector.delete({ where: { id } });
        } catch (error) {
            if ( error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025' ) {
                throw new NotFoundException('Setor não encontrado');
            }
            throw error;
        }
    }

    async getFoods(id: string): Promise<Food[]> {
        const sector = await this.prisma.sector.findUnique({ where: { id }, include: { foods: true } });
        if (!sector) throw new NotFoundException('Setor não encontrado');
        return sector.foods;
    }
}

