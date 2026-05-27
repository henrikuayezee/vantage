import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength, Matches } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'Current password — required when changing password' })
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @ApiPropertyOptional({ description: 'New password — requires currentPassword' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/, {
    message: 'Password must contain uppercase, number, and special character',
  })
  newPassword?: string;
}
