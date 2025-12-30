import { IsNumber, IsUUID } from "class-validator";

export class CreateTemperatureRecordsDto {

    @IsUUID()
    foodId: string;

    @IsNumber()
    temperature: number;

}
