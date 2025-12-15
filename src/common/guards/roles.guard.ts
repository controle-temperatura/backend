import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class RolesGuard implements CanActivate {
    canActivate(ctx: ExecutionContext): boolean {
        const req = ctx.switchToHttp().getRequest();
        const user = req.user;
        const requiredRoles = Reflect.getMetadata('roles', ctx.getHandler());

        if (!requiredRoles) return true;
        return requiredRoles.includes(user.role);
    }
}
