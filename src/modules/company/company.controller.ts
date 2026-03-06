import { Body, Controller, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { CompanyService } from './company.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Role } from '@prisma/client';
import { Roles } from 'src/common/decorators/role.decorator';
import { CreateCompanyDto } from './dto/create-company.dto';
import { User } from 'src/common/decorators/user.decorator';

@Controller('company')
export class CompanyController {
    constructor(private readonly companyService: CompanyService) {}

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(@User() user) {
        return this.companyService.find(user.companyId);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.SUPER_ADMIN)
    @Get('all')
    findAllCompanies() {
        return this.companyService.findAllCompanies();
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.SUPER_ADMIN)
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.companyService.findOne(id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @Put(':id')
    put(@Param('id') id: string, @Body() dto: UpdateCompanyDto) {
        return this.companyService.update(id, dto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.SUPER_ADMIN)
    @Post()
    create(@Body() dto: CreateCompanyDto) {
        return this.companyService.create(dto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.SUPER_ADMIN)
    @Put(':id/active')
    updateActive(@Param('id') id: string, @Body('active') active: boolean) {
        return this.companyService.updateActive(id, active);
    }
}
