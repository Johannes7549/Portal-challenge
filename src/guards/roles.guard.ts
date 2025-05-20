import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { UserRole } from '../enums/user-role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const requiredRoles = this.reflector.get<UserRole[]>(
      ROLES_KEY,
      context.getHandler(),
    );
    if (!requiredRoles) {
      return true; // No roles specified, allow access
    }

    const request = context.switchToHttp().getRequest();
    // Assuming the user object is attached to the request by an authentication guard
    // and has a 'role' property.
    const user = request.user; 

    // Basic check: does the user's role match any of the required roles?
    // You might need more complex logic based on how roles are stored (e.g., array of roles)
    // and the specific permissions matrix.
    return requiredRoles.some((role) => user.role === role);
  }
} 