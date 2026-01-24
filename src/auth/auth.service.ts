import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { RegisterDto, LoginDto } from '@common/dto/user.dto';
import { ConfigService } from '@nestjs/config';
import { UserDocument } from '../users/schemas/user.schema';
import { StringValue } from 'ms';
import { KafkaService } from '../kafka/kafka.service';

@Injectable()
export class AuthService {
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
      throw new UnauthorizedException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    
    const user = await this.usersService.create({
      email,
      password: hashedPassword,
      name,
    });
    
    const userId =
      user && (user as any)._id && typeof (user as any)._id.toString === 'function'
        ? (user as any)._id.toString()
        : String((user as any)._id ?? (user as any).id ?? '');

    await this.kafkaService.emit('user.created', { userId });

    return this.generateTokens(user);
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<UserDocument, 'password'> | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;
    if (!user.password) return null;

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return null;

    const userObj =
      (user as any).toObject?.() ?? { ...(user as any) };
    delete userObj.password;

    return userObj as any;
  }

  async login(
    user: UserDocument,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.generateTokens(user);
  }

  async refresh(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = this.jwtService.verify<{ sub: string }>(
        refreshToken,
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        },
      );

      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException();
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private generateTokens(
    user: any,
  ): { accessToken: string; refreshToken: string } {
    const id =
      user && user._id && typeof user._id.toString === 'function'
        ? user._id.toString()
        : String(user._id ?? user.id ?? '');

    const payload = {
      email: user.email,
      sub: id,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<StringValue>(
        'JWT_ACCESS_EXPIRES',
        '15m',
      ),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<StringValue>(
        'JWT_REFRESH_EXPIRES',
        '7d',
      ),
    });

    return { accessToken, refreshToken };
  }
}
