import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
    Res,
  UsePipes
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
//import { LocalAuthGuard } from './guards/local.guard';
import { RegisterDto, LoginDto } from '../common/dto/user.dto';
//import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { JoiValidationPipe } from '../common/decorators/joi-validation.decorator';

//@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
  ) {}

  @Post('register')
  //@ApiOperation({ summary: 'Register new user' })
  async register(@Body() registerDto: any) {
    // return this.authService.register(registerDto);
    null;
  }

  //@UseGuards(LocalAuthGuard)
  @Post('login')
  @UsePipes(new JoiValidationPipe(LoginDto))
  //@ApiOperation({ summary: 'Login user' })
  async login(@Req() req) {
    //return this.authService.login(req.user);
    null;
  }

  @Post('refresh')
  //@ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body('refreshToken') refreshToken: string) {
    //return this.authService.refresh(refreshToken);
    null;
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  async logout(@Req() req, @Res() res) {
    // Token revocation in Phase 2
    res.json({ message: 'Logged out successfully' });
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  //@ApiOperation({ summary: 'Google OAuth login' })
  googleAuth(@Req() req) {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req, @Res() res) {
    const user = req.user;
    //const token = this.authService.login(user);
    //res.redirect(`http://localhost:3000?token=${token.accessToken}`);
    null;
  }
}
