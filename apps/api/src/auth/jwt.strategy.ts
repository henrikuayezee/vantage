import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../common/decorators/current-user.decorator';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_PUBLIC_KEY').replace(/\\n/g, '\n'),
      algorithms: ['RS256'],
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    // Verify tokenVersion matches DB — allows instant session invalidation
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { tokenVersion: true, isActive: true },
    });

    if (!user || !user.isActive || user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException('Session expired');
    }

    return payload;
  }
}
