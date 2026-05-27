import { IsString, IsOptional, IsDateString, MaxLength } from 'class-validator';

export class UpdateMilestoneDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  color?: string;
}
