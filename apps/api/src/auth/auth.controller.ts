import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { ConfigService } from '@nestjs/config';

const REFRESH_COOKIE = 'vantage_refresh';
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/api/auth',
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private auth: AuthService,
    private config: ConfigService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 15 * 60 * 1000, limit: 30 } })
  @ApiOperation({ summary: 'Log in with email + password' })
  @ApiResponse({ status: 200, description: 'Returns access token; sets httpOnly refresh cookie' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = req.ip ?? 'unknown';
    const { accessToken, refreshToken } = await this.auth.login(dto, ip);
    res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTS);
    return { accessToken };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using httpOnly cookie' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const raw = (req.cookies as Record<string, string>)[REFRESH_COOKIE] ?? '';
    const { accessToken, refreshToken } = await this.auth.refresh(raw);
    res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTS);
    return { accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Log out — invalidates refresh token' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const raw = (req.cookies as Record<string, string>)[REFRESH_COOKIE] ?? '';
    await this.auth.logout(raw);
    res.clearCookie(REFRESH_COOKIE, { path: COOKIE_OPTS.path });
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Invalidate all sessions for this user' })
  async logoutAll(@CurrentUser() user: JwtPayload, @Res({ passthrough: true }) res: Response) {
    await this.auth.logoutAll(user.sub);
    res.clearCookie(REFRESH_COOKIE, { path: COOKIE_OPTS.path });
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { ttl: 15 * 60 * 1000, limit: 3 } })
  @ApiOperation({ summary: 'Send password reset email' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    await this.auth.forgotPassword(dto, frontendUrl);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { ttl: 15 * 60 * 1000, limit: 5 } })
  @ApiOperation({ summary: 'Set new password using reset token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.auth.resetPassword(dto);
  }

  @Public()
  @Post('accept-invite')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept invitation and create account' })
  async acceptInvite(
    @Body() dto: AcceptInviteDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.auth.acceptInvite(dto);
    res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTS);
    return { accessToken };
  }
}
