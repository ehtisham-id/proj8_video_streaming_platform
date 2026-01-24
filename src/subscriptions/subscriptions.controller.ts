import { Controller, Post, Get, Req, UseGuards } from '@nestjs/common';
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
    return this.subscriptionsService.startSubscription(req.user._id);
  }

  @Post('cancel')
  async cancel(@Req() req) {
    return this.subscriptionsService.cancelSubscription(req.user._id);
  }

  @Get('status')
  async status(@Req() req) {
    return this.subscriptionsService.getStatus(req.user._id);
  }
}
