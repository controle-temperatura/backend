import { IsString, MinLength } from 'class-validator';

export class CreatePasswordDto {
    @IsString()
    token: string;

    @IsString()
    @MinLength(6)
    password: string;
}
