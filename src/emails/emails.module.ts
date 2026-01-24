import { Module } from '@nestjs/common';
import { EmailService } from './emails.service';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [KafkaModule],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailsModule {}
