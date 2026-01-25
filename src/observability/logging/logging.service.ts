import { Injectable, LoggerService, Scope } from '@nestjs/common';
import pino from 'pino';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggingService implements LoggerService {
  private readonly logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport:
      process.env.NODE_ENV !== 'production'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              singleLine: true,
            },
          }
        : undefined,
    base: {
      pid: false,
      hostname: process.env.HOSTNAME,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  });

  log(message: any) {
    this.logger.info(message);
  }

  error(message: any, trace?: string) {
    let msgStr: string;
    if (message instanceof Error) {
      msgStr = message.message;
      trace = trace ?? message.stack;
    } else if (typeof message === 'object') {
      try {
        msgStr = JSON.stringify(message);
      } catch {
        msgStr = String(message);
      }
    } else {
      msgStr = String(message);
    }

    const msgWithTrace = trace ? `${msgStr}\n${trace}` : msgStr;
    this.logger.error(msgWithTrace);
  }

  warn(message: any) {
    this.logger.warn(message);
  }

  debug(message: any) {
    this.logger.debug(message);
  }

  verbose(message: any) {
    this.logger.trace(message);
  }
}
