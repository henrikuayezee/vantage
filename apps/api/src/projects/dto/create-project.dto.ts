import { IsString, IsOptional, IsDateString, Matches, MinLength, MaxLength } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{2,5}$/, { message: 'Key must be 2–5 uppercase letters' })
  key?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
