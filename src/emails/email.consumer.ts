import { 
  Injectable, 
  OnModuleInit, 
  OnModuleDestroy 
} from '@nestjs/common';
import { KafkaService } from '../kafka/kafka.service';
import { EmailService } from './emails.service';
import { UsersService } from '../users/users.service';
import { VideosService } from '../videos/videos.service';

@Injectable()
export class EmailConsumer implements OnModuleInit, OnModuleDestroy {
  constructor(
    private kafkaService: KafkaService,
    private emailService: EmailService,
    private usersService: UsersService,
    private videosService: VideosService,
  ) {}

  async onModuleInit() {
    const consumer = this.kafkaService.getConsumer('email-service');
    await consumer.connect();
    
    await consumer.subscribe({ 
      topics: ['user.created', 'user.logged_in', 'video.processing.completed', 'subscription.started', 'subscription.canceled', 'email.send'],
      fromBeginning: false 
    });

    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        const value = message.value?.toString();
        if (!value) return;
        let event: any;
        try {
          event = JSON.parse(value);
        } catch (err) {
          // invalid JSON payload, skip this message
          return;
        }
        
        switch (topic) {
          case 'user.created':
            await this.handleUserCreated(event);
            break;
          case 'subscription.started':
            await this.handleSubscriptionStarted(event);
            break;
          case 'subscription.canceled':
            await this.handleSubscriptionCanceled(event);
            break;
          case 'video.processing.completed':
            await this.handleVideoReady(event);
            break;
          case 'email.send':
            await this.handleDirectEmail(event);
            break;
        }
      },
    });
  }

  async onModuleDestroy() {
    // Cleanup consumer
  }

  private async handleUserCreated(event: any) {
    const user = await this.usersService.findById(event.userId);
    await this.emailService.send(
      user.email,
      'welcome',
      { user, subject: 'Welcome to Video Platform!' } as any
    );
  }

  private async handleSubscriptionStarted(event: any) {
    const user = await this.usersService.findById(event.userId);
    await this.emailService.send(
      user.email,
      'subscription',
      { 
        user, 
        status: 'active',
        subject: 'Welcome to Premium!' 
      } as any
    );
  }

  private async handleSubscriptionCanceled(event: any) {
    const user = await this.usersService.findById(event.userId);
    await this.emailService.send(
      user.email,
      'subscription',
      { 
        user, 
        status: 'canceled',
        subject: 'Subscription Canceled' 
      } as any
    );
  }

  private async handleVideoReady(event: any) {
    const video = await this.videosService.findById(event.videoId);
    const user = await this.usersService.findById(video.userId);
    await this.emailService.send(
      user.email,
      'video-ready',
      { 
        user, 
        videoTitle: video.title,
        streamUrl: `http://localhost/stream/${(video as any).id}/master.m3u8`,
        subject: `Your video "${video.title}" is ready!`
      } as any
    );
  }

  private async handleDirectEmail(event: any) {
    await this.emailService.send(event.to, event.template, event.context);
  }
}
