import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateSectorDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsUUID()
  responsibleUserId?: string;
}

