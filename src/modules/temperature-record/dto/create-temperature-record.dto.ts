import { IsNumber, IsUUID } from "class-validator";

export class CreateTemperatureRecordDto {

    @IsUUID()
    foodId: string;

    @IsNumber()
    temperature: number;

}