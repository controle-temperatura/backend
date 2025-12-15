import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { User } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
    ) {}

    async validateUser(email: string, password: string) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) throw new UnauthorizedException('Invalid credentials');

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) throw new UnauthorizedException('Invalid credentials');

        return user;
    }

    async login(user: User): Promise<{ access_token: string, refresh_token: string }> {
        const payload = { sub: user.id, email: user.email };
        return {
            access_token: await this.jwt.signAsync(payload, { expiresIn: '15m' }),
            refresh_token: await this.jwt.signAsync(payload, { expiresIn: '7d' }),
        };
    }
}
