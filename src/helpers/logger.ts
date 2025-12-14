import * as os from 'os';
import _ from 'lodash';

enum LogLevel {
  CHILD = 'child',
  FATAL = 'fatal',
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  TRACE = 'trace',
}

class Logger {
  private data: Record<string, any> = {};

  constructor(
    private config: {
      requestId?: string;
      externalRequestId?: string;
      ips?: string[];
    } = {
      requestId: null,
      externalRequestId: null,
      ips: [],
    },
  ) {}

  public log(level: LogLevel, message: string, data: Record<string, any>) {
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
      requestId: this.config.requestId,
      externalRequestId: this.config.externalRequestId,
      ips: this.config.ips,
      message,
      date: new Date(),
      data: logData,
    });

    process.stdout.write(`${logLine}${os.EOL}`);
  }

  public child(data: Record<string, any>) {
    this.data = {
      ...this.data,
      ...data,
    };
  }
}

class ClsLogger {
  private logger = new Logger();

  private log(level: LogLevel, message: string, data?: Record<string, any>) {
    this.logger.log(level, message, data);
  }

  public fatal(message: string, data?: Record<string, any>) {
    this.log(LogLevel.FATAL, message, data);
  }

  public error(message: string, data?: Record<string, any>) {
    this.log(LogLevel.ERROR, message, data);
  }

  public warn(message: string, data?: Record<string, any>) {
    this.log(LogLevel.WARN, message, data);
  }

  public info(message: string, data?: Record<string, any>) {
    this.log(LogLevel.INFO, message, data);
  }

  public debug(message: string, data?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, data);
  }

  public trace(message: string, data?: Record<string, any>) {
    this.log(LogLevel.TRACE, message, data);
  }

  public child(data: Record<string, any>) {
    this.logger.log(LogLevel.CHILD, 'child_log', data);
  }
}

export const logger = new ClsLogger();
