import { createNamespace } from 'cls-hooked';
import * as fs from 'fs';
import * as os from 'os';
import { v4 } from 'uuid';
import { Context, Next } from 'koa';
import * as _ from 'lodash';

export enum CLS_NAMESPACES {
  SESSION = 'SESSION',
}

export const NAMESPACE_VALUES = {
  [CLS_NAMESPACES.SESSION]: {
    LOGGER: 'LOGGER',
  },
};

enum LogLevel {
  FATAL = 'fatal',
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  TRACE = 'trace',
}

const session = createNamespace(CLS_NAMESPACES.SESSION);

const writeStream = fs.createWriteStream('./logs/app.log', { flags: 'a' });

export async function setLogger(ctx: Context, next: Next) {
  await new Promise<void>((resolve) => {
    session.run(async () => {
      const requestId = v4();
      const externalRequestId = ctx.get('x-request-id') || v4();

      const loggerInstance = new Logger(requestId, externalRequestId);

      session.set(
        NAMESPACE_VALUES[CLS_NAMESPACES.SESSION].LOGGER,
        loggerInstance,
      );

      ctx.set('request-id', requestId);
      ctx.set('x-request-id', externalRequestId);

      await next();

      resolve();
    });
  });
}

class Logger {
  private data: Record<any, any> = {};

  constructor(
    private requestId: string = null,
    private externalRequestId: string = null,
  ) {}

  public log(level: LogLevel, message: string, data: Record<any, any>) {
    const logData = {
      ...this.data,
      ...data,
    };

    _.forEach(logData, (value, key) => {
      if (value instanceof Error) {
        logData[key] = {
          name: value.name,
          message: value.message,
          stack: value.stack,
        };
      }
    });

    const logLine = JSON.stringify({
      level,
      requestId: this.requestId,
      externalRequestId: this.externalRequestId,
      message,
      date: new Date(),
      data: logData,
    });

    process.stdout.write(`${logLine}${os.EOL}`);

    writeStream.write(logLine);
    writeStream.write(os.EOL);
  }

  public child(data: Record<any, any>) {
    this.data = {
      ...this.data,
      ...data,
    };
  }
}

class ClsLogger {
  private logger = new Logger();

  private log(level: LogLevel, message: string, data?: Record<any, any>) {
    const loggerInstance: Logger = session.get(
      NAMESPACE_VALUES[CLS_NAMESPACES.SESSION].LOGGER,
    );

    if (!loggerInstance) {
      this.logger.log(level, message, data);

      return;
    }

    loggerInstance.log(level, message, data);
  }

  public fatal(message: string, data?: Record<any, any>) {
    this.log(LogLevel.FATAL, message, data);
  }

  public error(message: string, data?: Record<any, any>) {
    this.log(LogLevel.ERROR, message, data);
  }

  public warn(message: string, data?: Record<any, any>) {
    this.log(LogLevel.WARN, message, data);
  }

  public info(message: string, data?: Record<any, any>) {
    this.log(LogLevel.INFO, message, data);
  }

  public debug(message: string, data?: Record<any, any>) {
    this.log(LogLevel.DEBUG, message, data);
  }

  public trace(message: string, data?: Record<any, any>) {
    this.log(LogLevel.TRACE, message, data);
  }

  public child(data: Record<any, any>) {
    const clsLogger: ClsLogger = session.get(
      NAMESPACE_VALUES[CLS_NAMESPACES.SESSION].LOGGER,
    );

    if (!clsLogger) {
      this.logger.log(LogLevel.TRACE, 'child', data);

      return;
    }

    clsLogger.log(LogLevel.TRACE, 'child', data);
    clsLogger.child(data);
  }
}

export const logger = new ClsLogger();
