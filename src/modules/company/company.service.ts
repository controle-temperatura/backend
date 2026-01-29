import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CreateCompanyDto } from './dto/create-company.dto';

@Injectable()
export class CompanyService {
    constructor(private readonly prisma: PrismaService) {}

    async findAll() {
        return this.prisma.company.findFirst();
    }

    async update(id: string, dto: UpdateCompanyDto) {
        return this.prisma.company.update({
            where: { id },
            data: dto,
        });
    }

    async create(dto: CreateCompanyDto) {
        return this.prisma.company.create({
            data: dto,
        });
    }
}
