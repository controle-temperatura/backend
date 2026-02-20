import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CreateCompanyDto } from './dto/create-company.dto';

@Injectable()
export class CompanyService {
    constructor(private readonly prisma: PrismaService) {}

    async findAll() {
        return this.prisma.company.findFirst();
    }

    async update(id: string, data: UpdateCompanyDto) {
        const company = await this.prisma.company.findFirst();
        if (!company) {
            throw new NotFoundException('Empresa não encontrada');
        }
        return this.prisma.company.update({
            where: { id: company.id },
            data,
        });
    }

    async create(dto: CreateCompanyDto) {
        return this.prisma.company.create({
            data: dto,
        });
    }
}
