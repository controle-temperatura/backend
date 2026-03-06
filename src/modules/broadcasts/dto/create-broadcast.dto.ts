import { IsEnum, IsOptional, IsString, IsUUID } from "class-validator";

export enum BroadcastTarget {
    ALL = "ALL",
    COMPANY = "COMPANY"
}

export class CreateBroadcastDto {
    @IsString()
    title: string;

    @IsString()
    message: string;

    @IsEnum(BroadcastTarget)
    targetType: BroadcastTarget;

    @IsUUID()
    @IsOptional()
    companyId?: string;
}