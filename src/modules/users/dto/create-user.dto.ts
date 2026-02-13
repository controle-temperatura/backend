import { Role } from '@prisma/client';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

export class CreateUserDto {
    @IsString()
    name: string;

    @IsEmail()
    email: string;

    @IsString()
    @IsOptional()
    @MinLength(6)
    password?: string;

    @IsOptional()
    @IsEnum(Role)
    role?: Role;

    @IsOptional()
    @IsUrl()
    profilePicUrl?: string;

    @IsString()
    @IsEnum(["MANUAL", "LINK"])
    passwordType: string;

    @IsOptional()
    @IsBoolean()
    active?: boolean;
}
