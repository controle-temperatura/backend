import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Prisma, Role, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreatePasswordDto } from './dto/create-password.dto';

type SafeUser = Omit<User, 'passwordHash'>;

@Injectable()
export class UsersService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly mailService: MailService,
    ) {}

    private toSafeUser(user: User): SafeUser {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash, ...rest } = user;
        return rest;
    }

    private async generatePassword(): Promise<string> {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    private generateCreatePasswordToken() {
        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        return { token, tokenHash, expiresAt };
    }

    private async createPasswordToken(userId: string): Promise<string> {
        const { token, tokenHash, expiresAt } = this.generateCreatePasswordToken();

        await this.prisma.createPasswordToken.create({
            data: {
                userId,
                tokenHash,
                expiresAt,
            },
        });

        return token;
    }

    async create(dto: CreateUserDto): Promise<SafeUser> {
        
        let active = true;
        let shouldSendPasswordLink = false;

        if (dto.passwordType === "LINK") {
            const password = await this.generatePassword();
            dto.password = password;

            active = false;
            shouldSendPasswordLink = true;
        } 

        const passwordHash = await bcrypt.hash(dto.password, 10);

        const user = await this.prisma.user.create({
            data: {
                name: dto.name,
                email: dto.email,
                passwordHash,
                role: dto.role ?? Role.COLABORATOR,
                active,
            },
        });
        
        if (shouldSendPasswordLink) {
            const company = await this.prisma.company.findFirst();
            const token = await this.createPasswordToken(user.id);

            await this.mailService.sendCreatePasswordEmail({
                name: user.name,
                email: user.email,
                token,
                companyName: company?.name ?? '',
                companyShortName: company?.shortName ?? '',
                logoUrl: company?.logoUrl ?? '',
            });
        }

        return this.toSafeUser(user);
    }

    async createPassword(dto: CreatePasswordDto): Promise<{ message: string }> {
        const tokenHash = crypto.createHash('sha256').update(dto.token).digest('hex');
        const now = new Date();

        const tokenRecord = await this.prisma.createPasswordToken.findUnique({
            where: { tokenHash },
        });

        if (!tokenRecord || tokenRecord.usedAt || tokenRecord.expiresAt < now) {
            throw new BadRequestException('Token inválido ou expirado');
        }

        const passwordHash = await bcrypt.hash(dto.password, 10);

        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: tokenRecord.userId },
                data: {
                    passwordHash,
                    active: true,
                },
            }),
            this.prisma.createPasswordToken.update({
                where: { id: tokenRecord.id },
                data: { usedAt: now },
            }),
        ]);

        return { message: 'Senha criada com sucesso' };
    }

    async findAll(filters: any): Promise<any> {
        const { page, limit, ...searchFilters } = filters;

        if (searchFilters.active) searchFilters.active = searchFilters.active === 'true';

        const pageNumber = parseInt(page) || 1;
        const skip = (pageNumber - 1) * Number(limit) as number;

        const totalCount = await this.prisma.user.count();
        const totalRecords = await this.prisma.user.count({ where: { ...searchFilters } });
        const totalColaborators = await this.prisma.user.count({ where: { ...searchFilters, role: Role.COLABORATOR } });
        const totalAdmins = await this.prisma.user.count({ where: { ...searchFilters, role: Role.ADMIN } });
        const totalAuditors = await this.prisma.user.count({ where: { ...searchFilters, role: Role.AUDITOR } });

        const users = await this.prisma.user.findMany({ 
            where: { ...searchFilters }, 
            skip, 
            take: Number(limit) as number,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                active: true
            }
        });

        const roleLables = { [Role.ADMIN]: 'Administrador', [Role.AUDITOR]: 'Auditor', [Role.COLABORATOR]: 'Colaborador' };

        const formattedUsers = users.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: roleLables[user.role],
            active: user.active
        }));

        return {
            users: formattedUsers,
            totalColaborators,
            totalAdmins,
            totalAuditors,
            totalCount,
            pagination: {
                page: pageNumber,
                limit: Number(limit) as number,
                totalRecords,
                totalPages: Math.ceil(totalRecords / Number(limit) as number)
            }
        };
    }

    async findOne(id: string): Promise<SafeUser> {
        const user = await this.prisma.user.findUnique({ where: { id } });

        if (!user) throw new NotFoundException('Usuário não encontrado');

        return this.toSafeUser(user);
    }

    async update(id: string, dto: UpdateUserDto): Promise<SafeUser> {
        const data: Prisma.UserUpdateInput = {};

        if (dto.name !== undefined) data.name = dto.name;
        if (dto.email !== undefined) data.email = dto.email;
        if (dto.role !== undefined) data.role = dto.role;
        if (dto.profilePicUrl !== undefined) data.profilePicUrl = dto.profilePicUrl;

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
            if ( error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025' ) {
                throw new NotFoundException('Usuário não encontrado');
            }

            throw error;
        }
    }

    async remove(id: string): Promise<SafeUser> {
        try {
            const user = await this.prisma.user.delete({ where: { id } });

            return this.toSafeUser(user);
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                throw new NotFoundException('Usuário não encontrado');
            }

            throw error;
        }
    }

    async getRoles(): Promise<any[]> {
        const roles = Object.values(Role);

        const roleLables = { [Role.ADMIN]: 'Administrador', [Role.AUDITOR]: 'Auditor', [Role.COLABORATOR]: 'Colaborador' };
        return roles.map(role => ({ id: role, name: roleLables[role] }));
    }
}
