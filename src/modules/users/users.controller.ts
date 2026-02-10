import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Query,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { CreatePasswordDto } from './dto/create-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
import { Roles } from 'src/common/decorators/role.decorator';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Role } from '@prisma/client';
import { User } from 'src/common/decorators/user.decorator';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Post()
    create(@Body() dto: CreateUserDto) {
        return this.usersService.create(dto);
    }

    @Post('create-password')
    createPassword(@Body() dto: CreatePasswordDto) {
        return this.usersService.createPassword(dto);
    }

    @Get()
    findAll(@Query() filters: any) {
        return this.usersService.findAll(filters);
    }

    @Get('admins')
    getAdmins() {
        return this.usersService.getAdmins();
    }

    @Get('roles')
    getRoles() {
        return this.usersService.getRoles();
    }

    @UseGuards(JwtAuthGuard)
    @Get('measurements')
    getMeasurements(@User() user: { userId: string }, @Query('date') date: string) {
        return this.usersService.getMeasurements(user.userId, date);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
        return this.usersService.update(id, dto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.usersService.remove(id);
    }
}
