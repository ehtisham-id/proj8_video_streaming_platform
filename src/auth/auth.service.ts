import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { RegisterDto, LoginDto } from '@common/dto/user.dto';
import { ConfigService } from '@nestjs/config';
import { StringValue } from 'ms';
import { KafkaService } from '../kafka/kafka.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly kafkaService: KafkaService,
  ) {}

  async register(
    registerDto: RegisterDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { email, password, name } = registerDto;

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      const { password: _pwd, ...meta } = existingUser as any;
      this.logger.warn(
        `Registration attempt for existing email ${email}: ${JSON.stringify(meta)}`,
      );
      throw new UnauthorizedException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await this.usersService.create({
      email,
      password: hashedPassword,
      name,
    });

    const userId =
      user &&
      (user as any)._id &&
      typeof (user as any)._id.toString === 'function'
        ? (user as any)._id.toString()
        : String((user as any)._id ?? (user as any).id ?? '');

    await this.kafkaService.emit('user.created', { userId });

    return this.generateTokens(user);
  }

  async validateUser(email: string, password: string): Promise<any | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      this.logger.debug(`validateUser: no user found for ${email}`);
      return null;
    }
    if (!user.password) {
      const { password: _pwd, ...meta } = user as any;
      this.logger.debug(
        `validateUser: user has no password (maybe oauth user) ${JSON.stringify(meta)}`,
      );
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return null;

    return user;
  }

  async login(
    user: any,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.generateTokens(user);
  }

  async refresh(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = this.jwtService.verify<{ sub: string }>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException();
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private generateTokens(user: any): {
    accessToken: string;
    refreshToken: string;
  } {
  

    const id =
      (user && user._id && typeof user._id.toString === 'function')
        ? user._id.toString()
        : user && user.id
        ? String(user.id)
        : null;

    if (!id) {
      throw new UnauthorizedException('Invalid user id');
    }

    const jti = uuidv4();
    const payload = { email: user.email, sub: id, jti };

    const accessSecret = this.configService.get<string>('JWT_SECRET');
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');

    if (!accessSecret || !refreshSecret) {
      throw new InternalServerErrorException(
        'JWT secrets are not configured. Set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET in environment',
      );
    }

    return {
      accessToken: this.jwtService.sign(payload, {
        secret: accessSecret,
        expiresIn: this.configService.get<StringValue>(
          'JWT_ACCESS_EXPIRES',
          '15m',
        ),
      }),
      refreshToken: this.jwtService.sign(payload, {
        secret: refreshSecret,
        expiresIn: this.configService.get<StringValue>(
          'JWT_REFRESH_EXPIRES',
          '7d',
        ),
      }),
    };
  }
}
