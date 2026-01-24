import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subscription, SubscriptionDocument } from './schemas/subscription.schema';
import { UsersService } from '../users/users.service';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
    private usersService: UsersService,
  ) {}

  async startSubscription(userId: string) {
    const user = await this.usersService.findById(userId);

    let subscription = await this.subscriptionModel.findOne({ userId });
    if (subscription?.status === 'active') {
      throw new ForbiddenException('Already subscribed');
    }

    subscription = new this.subscriptionModel({
      userId,
      status: 'active',
      plan: 'premium',
      currentPeriodEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // 1 year subscription
    });

    await subscription.save();
    return { message: 'Subscription activated', plan: subscription.plan };
  }

  async cancelSubscription(userId: string) {
    const subscription = await this.subscriptionModel.findOne({ userId });
    if (!subscription || subscription.status !== 'active') {
      throw new ForbiddenException('No active subscription');
    }

    subscription.status = 'canceled';
    subscription.plan = 'free';
    await subscription.save();

    return { message: 'Subscription canceled', plan: subscription.plan };
  }

  async getStatus(userId: string) {
    const subscription = await this.subscriptionModel.findOne({ userId }).lean();
    if (!subscription) return { status: 'free', plan: 'free' };

    return {
      status: subscription.status,
      plan: subscription.plan,
      currentPeriodEnd: subscription.currentPeriodEnd,
    };
  }

  async hasPremiumAccess(userId: string): Promise<boolean> {
    const status = await this.getStatus(userId);
    return status.plan === 'premium';
  }
}
