import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info, context) {
    // Debug: log whether Authorization header arrived at the guard
    try {
      const req = context?.switchToHttp?.().getRequest?.();
      const auth = req?.headers?.authorization;
      if (auth) {
        const preview = auth.length > 20 ? `${auth.substring(0, 20)}...` : auth;
      }
    } catch (e) {
      // ignore debugging errors
    }

    if (err || !user) {
      throw err || new UnauthorizedException('Invalid JWT token');
    }
    return user;
  }
}
