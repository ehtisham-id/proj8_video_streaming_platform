import {
  Controller,
  Post,
  Get,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { SubscriptionsService } from './subscriptions.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('subscriptions')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Post('start')
  async start(@Req() req) {
    const userId = req?.user?._id || req?.user?.id || req?.user?.sub;
    if (!userId) {
      console.debug('subscriptions.start: missing req.user', {
        user: req?.user,
      });
      throw new UnauthorizedException('Invalid user in request');
    }
    return this.subscriptionsService.startSubscription(userId);
  }

  @Post('cancel')
  async cancel(@Req() req) {
    const userId = req?.user?._id || req?.user?.id || req?.user?.sub;
    if (!userId) {
      console.debug('subscriptions.cancel: missing req.user', {
        user: req?.user,
      });
      throw new UnauthorizedException('Invalid user in request');
    }
    return this.subscriptionsService.cancelSubscription(userId);
  }

  @Get('status')
  async status(@Req() req) {
    const userId = req?.user?._id || req?.user?.id || req?.user?.sub;
    if (!userId) {
      console.debug('subscriptions.status: missing req.user', {
        user: req?.user,
      });
      throw new UnauthorizedException('Invalid user in request');
    }
    return this.subscriptionsService.getStatus(userId);
  }
}
