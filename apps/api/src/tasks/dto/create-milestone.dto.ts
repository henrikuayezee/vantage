import { IsString, IsOptional, IsDateString, MaxLength } from 'class-validator';

export class CreateMilestoneDto {
  @IsString()
  @MaxLength(120)
  title!: string;

  @IsDateString()
  dueDate!: string;

  @IsOptional()
  @IsString()
  color?: string;
}
