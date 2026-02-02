import { Role } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

export enum PasswordType {
    MANUAL = 'manual',
    AUTO = 'auto',
}

export class CreateUserDto {
    @IsString()
    name: string;

    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsOptional()
    @IsEnum(Role)
    role?: Role;

    @IsOptional()
    @IsUrl()
    profilePicUrl?: string;

    @IsString()
    @IsEnum(PasswordType)
    passwordType: string;
}
