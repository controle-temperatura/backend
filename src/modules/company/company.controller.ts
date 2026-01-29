import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CompanyService } from './company.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Role } from '@prisma/client';
import { Roles } from 'src/common/decorators/role.decorator';
import { CreateCompanyDto } from './dto/create-company.dto';

@Controller('company')
export class CompanyController {
    constructor(private readonly companyService: CompanyService) {}

    @Get()
    findAll() {
        return this.companyService.findAll();
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateCompanyDto) {
        return this.companyService.update(id, dto);
    }

    @Post()
    create(@Body() dto: CreateCompanyDto) {
        return this.companyService.create(dto);
    }
}
