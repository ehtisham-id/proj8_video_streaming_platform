import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as Handlebars from 'handlebars';
import * as fs from 'fs-extra';
import * as path from 'path';
import { KafkaService } from '../kafka/kafka.service';

interface EmailContext {
  user: { name: string; email: string };
  subject?: string;
  status?: string;
  videoTitle?: string;
  streamUrl?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor(
    private kafkaService: KafkaService,
    private configService: ConfigService,
  ) {
    this.initTransporter();
    this.loadTemplates();
  }

  private initTransporter() {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST') || 'smtp.mailtrap.io',
      port: Number(this.configService.get<number>('EMAIL_PORT')) || 587,
      secure: this.configService.get<boolean>('EMAIL_SECURE') || false,
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
    });
  }

  private async loadTemplates() {
    const templatesDir = './src/emails/templates';
    const files = await fs.readdir(templatesDir);

    for (const file of files) {
      if (file.endsWith('.hbs')) {
        const templateName = file.replace('.hbs', '');
        const content = await fs.readFile(
          path.join(templatesDir, file),
          'utf8',
        );
        this.templates.set(templateName, Handlebars.compile(content));
      }
    }
  }

  async send(to?: string, template?: string, context?: EmailContext) {
    // Use DUMMY_EMAIL_TO if "to" not provided
    const recipient = to || this.configService.get<string>('DUMMY_EMAIL_TO');

    const html = template ? this.templates.get(template)?.(context) : undefined;

    const mailOptions: nodemailer.SendMailOptions = {
      from:
        this.configService.get<string>('EMAIL_FROM') ||
        '"Video Platform" <noreply@videoplatform.com>',
      to: recipient,
      subject: context?.subject || `Update from Video Platform`,
      html,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent to ${recipient}: ${result.messageId}`);
      return result;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : (() => {
                try {
                  return JSON.stringify(error) || 'Unknown error';
                } catch {
                  return 'Unknown error';
                }
              })();
      this.logger.error(`Failed to send email to ${recipient}: ${message}`);
      throw error;
    }
  }
}
