import fs from "fs";
import path from "path";
import os from "os";

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  metadata?: Record<string, any>;
  error?: Error;
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;
  private context: string;
  private logDir: string;

  private constructor(context: string = 'App') {
    this.context = context;
    this.logDir = this.getLogDirectory();
    this.ensureLogDirExists();
  }

  public static getInstance(context?: string): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(context);
    }
    return Logger.instance;
  }

  public static createLogger(context: string): Logger {
    return new Logger(context);
  }

  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  private getLogDirectory(): string {
    const homeDir = os.homedir();
    return path.join(homeDir, ".postgeist", "logs");
  }

  private ensureLogDirExists(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private getColorCode(level: LogLevel): string {
    const colors = {
      [LogLevel.DEBUG]: '\x1b[36m', // Cyan
      [LogLevel.INFO]: '\x1b[32m',  // Green
      [LogLevel.WARN]: '\x1b[33m',  // Yellow
      [LogLevel.ERROR]: '\x1b[31m', // Red
      [LogLevel.FATAL]: '\x1b[35m'  // Magenta
    };
    return colors[level] || '\x1b[0m';
  }

  private getLevelName(level: LogLevel): string {
    const names = {
      [LogLevel.DEBUG]: 'DEBUG',
      [LogLevel.INFO]: 'INFO',
      [LogLevel.WARN]: 'WARN',
      [LogLevel.ERROR]: 'ERROR',
      [LogLevel.FATAL]: 'FATAL'
    };
    return names[level];
  }

  private formatMessage(level: LogLevel, message: string, metadata?: Record<string, any>): string {
    const timestamp = this.formatTimestamp();
    const colorCode = this.getColorCode(level);
    const levelName = this.getLevelName(level);
    const resetCode = '\x1b[0m';

    let formattedMessage = `${colorCode}[${timestamp}] ${levelName.padEnd(5)} [${this.context}]${resetCode} ${message}`;

    if (metadata && Object.keys(metadata).length > 0) {
      formattedMessage += `\n${colorCode}  Metadata:${resetCode} ${JSON.stringify(metadata, null, 2)}`;
    }

    return formattedMessage;
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, any>, error?: Error): void {
    if (level < this.logLevel) {
      return;
    }

    const formattedMessage = this.formatMessage(level, message, metadata);

    // Only show warnings and errors on console to keep UI clean
    if (level >= LogLevel.WARN) {
      if (level >= LogLevel.ERROR) {
        console.error(formattedMessage);
        if (error) {
          console.error(`${this.getColorCode(level)}  Stack Trace:\x1b[0m`, error.stack);
        }
      } else if (level === LogLevel.WARN) {
        console.warn(formattedMessage);
      }
    }

    // Create log entry for file persistence
    const logEntry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level,
      message,
      context: this.context,
      metadata,
      error
    };

    // Always log to file
    this.persistLog(logEntry);
  }

  private persistLog(entry: LogEntry): void {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const logFileName = `postgeist-${today}.log`;
      const logFilePath = path.join(this.logDir, logFileName);

      // Format log entry for file
      const levelName = this.getLevelName(entry.level);
      let logLine = `[${entry.timestamp}] ${levelName.padEnd(5)} [${entry.context}] ${entry.message}`;

      if (entry.metadata && Object.keys(entry.metadata).length > 0) {
        logLine += ` | Metadata: ${JSON.stringify(entry.metadata)}`;
      }

      if (entry.error) {
        logLine += ` | Error: ${entry.error.message}`;
        if (entry.error.stack) {
          logLine += ` | Stack: ${entry.error.stack}`;
        }
      }

      logLine += '\n';

      // Append to log file
      fs.appendFileSync(logFilePath, logLine, { encoding: 'utf8' });
    } catch (error) {
      // If logging fails, don't crash the app - just write to console as fallback
      console.error('Failed to write to log file:', error);
    }
  }

  public debug(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  public info(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  public warn(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  public error(message: string, error?: Error, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, metadata, error);
  }

  public fatal(message: string, error?: Error, metadata?: Record<string, any>): void {
    this.log(LogLevel.FATAL, message, metadata, error);
  }

  // Convenience methods for common scenarios
  public startOperation(operation: string, metadata?: Record<string, any>): void {
    this.info(`🚀 Starting ${operation}`, metadata);
  }

  public completeOperation(operation: string, metadata?: Record<string, any>): void {
    this.info(`✅ Completed ${operation}`, metadata);
  }

  public failOperation(operation: string, error: Error, metadata?: Record<string, any>): void {
    this.error(`❌ Failed ${operation}`, error, metadata);
  }

  public progress(message: string, current: number, total: number, metadata?: Record<string, any>): void {
    const percentage = Math.round((current / total) * 100);
    this.info(`📊 ${message} (${current}/${total} - ${percentage}%)`, metadata);
  }
}

// Export default logger instance
export const logger = Logger.getInstance();

// Export factory function for creating context-specific loggers
export const createLogger = (context: string): Logger => Logger.createLogger(context);
