import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { Role } from '@vantage/types';

export class InviteUserDto {
  @ApiProperty({ example: 'dev@acme.com' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ enum: Role, default: Role.DEVELOPER })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
