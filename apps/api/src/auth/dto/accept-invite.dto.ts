import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, Matches } from 'class-validator';

export class AcceptInviteDto {
  @ApiProperty()
  @IsString()
  token!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/, {
    message: 'Password must contain uppercase, number, and special character',
  })
  password!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  firstName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  lastName!: string;
}
