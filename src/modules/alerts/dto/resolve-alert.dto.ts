import { IsNumber, IsString } from "class-validator";

export class ResolveAlertDto {
    @IsString()
    correctiveAction: string;

    @IsNumber()
    correctedTemperature: number;
}