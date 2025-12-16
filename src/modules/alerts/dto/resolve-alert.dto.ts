import { IsString } from "class-validator";

export class ResolveAlertDto {
    @IsString()
    correctiveAction: string;
}