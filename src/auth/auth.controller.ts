import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
  Res,
  UsePipes,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '@common/guards/jwt.guard';
import { RedisService } from '../redis/redis.service';

import { JoiValidationPipe } from '../common/pipes/joi-validation.pipe';
import { RegisterSchema, LoginSchema } from '../common/dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly redisService: RedisService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  @UsePipes(new JoiValidationPipe(RegisterSchema))
  async register(@Body() body: any) {
    //console.log('validate:', typeof RegisterSchema.validate);
    return this.authService.register(body);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @UsePipes(new JoiValidationPipe(LoginSchema))
  async login(@Body() body: any) {
    //console.log('validate:', typeof LoginSchema.validate);
    return this.authService.login(body);
  }

  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req, @Res() res: Response) {
    const jti = req.user.jti;
    await this.redisService.blacklistToken(jti, 900);
    res.json({ message: 'Logged out successfully' });
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    if (!req.user) {
      return res.redirect('http://localhost?error=login_failed');
    }

    const tokens = await this.authService.login(req.user);
    res.redirect(`http://localhost?token=${tokens.accessToken}`);
  }
}
