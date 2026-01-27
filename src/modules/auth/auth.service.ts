import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { User } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
    ) {}

    async validateUser(email: string, password: string) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) throw new UnauthorizedException('Credenciais inválidas');

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) throw new UnauthorizedException('Credenciais inválidas');

        return user;
    }

    async login(user: User): Promise<{ access_token: string, refresh_token: string }> {
        const payload = { sub: user.id, email: user.email };
        const access_token = await this.jwt.signAsync(payload, { expiresIn: '15m' });
        const refresh_token = await this.generateRefreshToken(user.id);
        
        return { access_token, refresh_token };
    }

    private async generateRefreshToken(userId: string): Promise<string> {
        const token = randomBytes(64).toString('hex');
        
        const hashedToken = await bcrypt.hash(token, 10);
        
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        
        await this.prisma.refreshToken.create({
            data: {
                token: hashedToken,
                userId,
                expiresAt,
            },
        });
        
        return token;
    }

    async refreshAccessToken(refreshToken: string): Promise<{ access_token: string, refresh_token: string }> {
        const tokens = await this.prisma.refreshToken.findMany({
            where: {
                expiresAt: {
                    gte: new Date(),
                },
            },
            include: {
                user: true,
            },
        });

        let validToken: typeof tokens[0] | null = null;
        for (const storedToken of tokens) {
            const isValid = await bcrypt.compare(refreshToken, storedToken.token);
            if (isValid) {
                validToken = storedToken;
                break;
            }
        }

        if (!validToken) {
            throw new UnauthorizedException('Token de atualização inválido ou expirado');
        }

        await this.prisma.refreshToken.delete({
            where: { id: validToken.id },
        });

        const payload = { sub: validToken.user.id, email: validToken.user.email };
        const access_token = await this.jwt.signAsync(payload, { expiresIn: '15m' });
        const new_refresh_token = await this.generateRefreshToken(validToken.user.id);

        return { access_token, refresh_token: new_refresh_token };
    }

    async logout(userId: string, refreshToken?: string): Promise<void> {
        if (refreshToken) {
            const tokens = await this.prisma.refreshToken.findMany({
                where: { userId },
            });

            for (const storedToken of tokens) {
                const isValid = await bcrypt.compare(refreshToken, storedToken.token);
                if (isValid) {
                    await this.prisma.refreshToken.delete({
                        where: { id: storedToken.id },
                    });
                    break;
                }
            }
        } else {
            await this.prisma.refreshToken.deleteMany({
                where: { userId },
            });
        }
    }

    async cleanupExpiredTokens(): Promise<void> {
        await this.prisma.refreshToken.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date(),
                },
            },
        });
    }

    async getUserProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                profilePicUrl: true,
                createdAt: true,
            },
        });

        if (!user) {
            throw new UnauthorizedException('Usuário não encontrado');
        }

        return user;
    }
}
