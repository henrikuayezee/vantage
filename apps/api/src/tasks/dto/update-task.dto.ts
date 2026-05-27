import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  MinLength,
  MaxLength,
} from 'class-validator';
import { TaskStatus, Priority } from '@vantage/types';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsString()
  assigneeId?: string | null;

  @IsOptional()
  @IsString()
  milestoneId?: string | null;

  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @IsOptional()
  @IsDateString()
  dueDate?: string | null;

  @IsOptional()
  @IsNumber()
  position?: number;
}
