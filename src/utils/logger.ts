interface LogTypes {
  info: string;
  error: string;
  warn: string;
}

const logEmoji: LogTypes = {
  info: '💡',
  error: '❌',
  warn: '⚠️',
};

const isDevelopment = process.env.NODE_ENV === 'development';

class Logger {
  private static instance: Logger;
  private logBuffer: string[] = [];

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  log(...args: unknown[]): void {
    if (isDevelopment) {
      this.logBuffer.push(args.map(arg => String(arg)).join(' '));
      this.flush();
    }
  }

  error(...args: unknown[]): void {
    if (isDevelopment) {
      this.logBuffer.push(`ERROR: ${args.map(arg => String(arg)).join(' ')}`);
      this.flush();
    }
  }

  private flush(): void {
    while (this.logBuffer.length > 0) {
      const message = this.logBuffer.shift();
      if (message) {
        process.stdout.write(`${message}\n`);
      }
    }
  }
}

export const logger = Logger.getInstance();

export function log(message: string, type: keyof LogTypes = 'info'): void {
  logger.log(`[Figy ${logEmoji[type]}] ${message}`);
}
