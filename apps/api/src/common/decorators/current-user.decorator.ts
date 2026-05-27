import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  organizationId: string;
  tokenVersion: number;
}

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request & { user: JwtPayload }>();
  return request.user;
});
