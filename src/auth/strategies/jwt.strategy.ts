import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { RedisService } from '../../redis/redis.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly usersService: UsersService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Use access token secret (matches AuthService.generateTokens)
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: any) {
    // 1️⃣ Check if token is blacklisted in Redis
    if (await this.redisService.isTokenBlacklisted(payload.jti)) {
      throw new UnauthorizedException('Token revoked');
    }

    // 2️⃣ Fetch user from DB
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // 3️⃣ Return user payload (can include jti for token revocation tracking)
    return { ...user, jti: payload.jti };
  }
}
