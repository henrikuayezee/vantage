import { IsString, IsOptional, IsDateString, IsEnum, MinLength, MaxLength } from 'class-validator';
import { ProjectStatus } from '@vantage/types';

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @IsOptional()
  @IsDateString()
  endDate?: string | null;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;
}
