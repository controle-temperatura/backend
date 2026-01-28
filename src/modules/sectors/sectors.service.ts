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
            data: {
                name: dto.name,
                responsibleUserId: dto.responsibleUserId,
            },
        });
    }

    async findAll(): Promise<Sector[]> {
        return this.prisma.sector.findMany();
    }

    async findOne(id: string): Promise<Sector> {
        const sector = await this.prisma.sector.findUnique({ where: { id } });
        if (!sector) throw new NotFoundException('Setor não encontrado');
        return sector;
    }

    getForFilters(): Promise<any[]> {
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

