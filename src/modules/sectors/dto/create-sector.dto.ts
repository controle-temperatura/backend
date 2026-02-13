import { IsArray, IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateSectorDto {
  @IsString()
  name: string;

  @IsUUID()
  responsibleUserId: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsString()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  measurementTimes?: string[];

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

