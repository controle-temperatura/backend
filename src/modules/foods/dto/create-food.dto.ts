import { IsNumber, IsString, IsUUID } from 'class-validator';

export class CreateFoodDto {
    @IsString()
    name: string;

    @IsUUID()
    sectorId: string;

    @IsNumber()
    tempMin: number;

    @IsNumber()
    tempMax: number;
}

