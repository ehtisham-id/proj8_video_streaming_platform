import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { UsersService } from './users.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  async getProfile(@Req() req) {
    return req.user;
  }

  @Patch('me')
  async updateProfile(@Req() req, @Body() updateData: any) {
    const userId = req?.user?._id || req?.user?.id || req?.user?.sub;
    if (!userId) {
      console.debug('users.updateProfile: missing req.user', {
        user: req?.user,
      });
      throw new UnauthorizedException('Invalid user in request');
    }
    return this.usersService.findById(userId);
  }
}
