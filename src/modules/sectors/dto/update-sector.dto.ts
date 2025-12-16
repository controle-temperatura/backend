import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateSectorDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUUID()
  responsibleUserId?: string | null;
}


