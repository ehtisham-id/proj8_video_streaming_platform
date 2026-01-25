import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { Kafka, Producer, Consumer } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafka = new Kafka({
    clientId: 'video-platform',
    brokers: [process.env.KAFKA_BROKERS || 'kafka:9092'],
  });
  private producer: Producer = this.kafka.producer();

  async onModuleInit() {
    try {
      await this.producer.connect();
      this.logger.log('Connected to Kafka broker');
    } catch (err: any) {
      this.logger.error(
        'Failed to connect to Kafka broker',
        err?.stack ?? String(err),
        KafkaService.name,
      );
      throw err;
    }
  }

  async onModuleDestroy() {
    try {
      await this.producer.disconnect();
      this.logger.log('Disconnected Kafka producer');
    } catch (err: any) {
      this.logger.error(
        'Failed to disconnect Kafka producer',
        err?.stack ?? String(err),
        KafkaService.name,
      );
    }
  }

  async emit(topic: string, message: any) {
    try {
      await this.producer.send({
        topic,
        messages: [{ value: JSON.stringify(message) }],
      });
    } catch (err: any) {
      this.logger.error(
        `Failed to send message to topic ${topic}`,
        err?.stack ?? String(err),
        KafkaService.name,
      );
      throw err;
    }
  }

  getProducer() {
    return this.producer;
  }

  admin() {
    return this.kafka.admin();
  }

  getConsumer(groupId: string): Consumer {
    return this.kafka.consumer({ groupId });
  }
}
