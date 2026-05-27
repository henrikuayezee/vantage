import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@vantage/types';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { JwtPayload } from '../decorators/current-user.decorator';
import { Request } from 'express';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const user = context.switchToHttp().getRequest<Request & { user: JwtPayload }>().user;
    if (!user) return false;

    const allowed = required.includes(user.role as Role);
    if (!allowed) throw new ForbiddenException('Insufficient permissions');
    return true;
  }
}
