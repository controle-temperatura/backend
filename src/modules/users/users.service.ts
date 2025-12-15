import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Prisma, Role, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { EditUserDto } from './dto/edit-user.dto';

type SafeUser = Omit<User, 'passwordHash'>;

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) {}

    private toSafeUser(user: User): SafeUser {
        // omit password hash when returning user data
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash, ...rest } = user;
        return rest;
    }

    async create(dto: CreateUserDto): Promise<SafeUser> {
        const passwordHash = await bcrypt.hash(dto.password, 10);

        const user = await this.prisma.user.create({
        data: {
            name: dto.name,
            email: dto.email,
            passwordHash,
            role: dto.role ?? Role.COLABORATOR,
        },
        });

        return this.toSafeUser(user);
    }

    async findAll(): Promise<SafeUser[]> {
        const users = await this.prisma.user.findMany();
        return users.map((user) => this.toSafeUser(user));
    }

    async findOne(id: string): Promise<SafeUser> {
        const user = await this.prisma.user.findUnique({
        where: { id },
        });

        if (!user) {
        throw new NotFoundException('User not found');
        }

        return this.toSafeUser(user);
    }

    async update(id: string, dto: EditUserDto): Promise<SafeUser> {
        const data: Prisma.UserUpdateInput = {};

        if (dto.name !== undefined) data.name = dto.name;
        if (dto.email !== undefined) data.email = dto.email;
        if (dto.role !== undefined) data.role = dto.role;
        if (dto.password !== undefined) {
        data.passwordHash = await bcrypt.hash(dto.password, 10);
        }

        try {
        const user = await this.prisma.user.update({
            where: { id },
            data,
        });

        return this.toSafeUser(user);
        } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2025'
        ) {
            throw new NotFoundException('User not found');
        }

        throw error;
        }
    }

    async remove(id: string): Promise<SafeUser> {
        try {
        const user = await this.prisma.user.delete({
            where: { id },
        });

        return this.toSafeUser(user);
        } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2025'
        ) {
            throw new NotFoundException('User not found');
        }

        throw error;
        }
    }
}
