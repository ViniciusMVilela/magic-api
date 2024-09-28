import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../decorators/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) { }
  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles) {
      return true;
    }

    return this.checkUserRoles(context, roles);
  }

  private checkUserRoles(context: ExecutionContext, roles: Role[]): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException('Unauthorized user or undefined role');
    }
    const userRoles = Array.isArray(user.role) ? user.role : [user.role];

    const hasRole = roles.some((role) => userRoles.includes(role));
    if (!hasRole) {
      throw new ForbiddenException('Access denied. Only users with appropriate permission can access this route.');
    }

    return true;
  }
}
