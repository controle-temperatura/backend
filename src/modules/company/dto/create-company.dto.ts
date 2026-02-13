import { IsString } from "class-validator";

export class CreateCompanyDto {
    @IsString()
    name: string;

    @IsString()
    shortName: string;

    @IsString()
    logoUrl: string;

    @IsString()
    cnpj: string;

    @IsString()
    address: string;

    @IsString()
    contactMail: string;

    @IsString()
    contactPhone: string;
}