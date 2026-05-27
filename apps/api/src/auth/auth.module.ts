import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    PassportModule,
    EmailModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        privateKey: config.getOrThrow<string>('JWT_PRIVATE_KEY').replace(/\\n/g, '\n'),
        publicKey: config.getOrThrow<string>('JWT_PUBLIC_KEY').replace(/\\n/g, '\n'),
        signOptions: {
          algorithm: 'RS256',
          expiresIn: (config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m') as '15m',
        },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
