import { IsString, IsOptional, IsEnum } from 'class-validator';
import { Role } from '@vantage/types';

export class AddMemberDto {
  @IsString()
  userId!: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
