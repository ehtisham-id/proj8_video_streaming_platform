import { Injectable, LoggerService, Scope } from '@nestjs/common';
import pino from 'pino';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggingService implements LoggerService {
  private logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV !== 'production' ? {
      target: 'pino-pretty',
      options: { colorize: true, singleLine: true },
    } : undefined,
    base: {
      pid: false,
      hostname: process.env.HOSTNAME,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  });

  log(message: any) {
    this.logger.info({ event: 'log' }, message);
  }

  error(message: any, trace = '') {
    this.logger.error({ event: 'error', trace }, message);
  }

  warn(message: any) {
    this.logger.warn({ event: 'warn' }, message);
  }

  debug(message: any) {
    this.logger.debug({ event: 'debug' }, message);
  }

  verbose(message: any) {
    this.logger.trace({ event: 'verbose' }, message);
  }
}
