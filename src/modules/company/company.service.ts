import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CreateCompanyDto } from './dto/create-company.dto';
import { Role } from '@prisma/client';
import { UsersService } from '../users/users.service';

@Injectable()
export class CompanyService {
    constructor(private readonly prisma: PrismaService, private readonly usersService: UsersService) {}

    async find(companyId: string) {
        
        const company = await this.prisma.company.findFirst({
            where: { id: companyId },
        });

        return company;
    }

    async findOne(id: string) {
        return this.prisma.company.findUnique({ 
            where: { id }, 
            include: { 
                owner: true, 
                users: true,
                sectors: true
            } 
        });
    }

    async findAllCompanies() {
        return this.prisma.company.findMany({
            orderBy: { name: 'asc' },
        });
    }

    async update(id: string, data: UpdateCompanyDto) {
        const company = await this.prisma.company.findUnique({ where: { id } });
        if (!company) {
            throw new NotFoundException('Empresa não encontrada');
        }
        return this.prisma.company.update({
            where: { id },
            data,
        });
    }

    async create(dto: CreateCompanyDto) {
        const { ownerEmail, ownerName, ...data } = dto;

        const company = await this.prisma.company.create({ data });

        const responsibleUser = await this.usersService.create({
            email: ownerEmail,
            name: ownerName,
            role: Role.ADMIN,
            passwordType: "LINK",
            companyId: company.id,
        }, company?.id);

        await this.prisma.company.update({
            where: { id: company.id },
            data: {
                ownerId: responsibleUser.id,
            },
        });

        return company;
    }

    async updateActive(id: string, active: boolean) {
        return this.prisma.company.update({
            where: { id },
            data: { active },
        });
    }
}
