/**
 * Logger Utility
 * Provides structured logging with file and console output
 */

import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { LogMetadata } from '../types';

/**
 * Logger class for consistent logging across the application
 */
export class Logger {
  private winston: winston.Logger;
  private context: string;

  constructor(context: string) {
    this.context = context;

    // Ensure logs directory exists
    const logsDir = process.env.LOG_FILE_PATH || './logs';
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Create Winston logger instance
    this.winston = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { context: this.context },
      transports: [
        // Error log file - only errors
        new winston.transports.File({
          filename: path.join(logsDir, 'error.log'),
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
        // Combined log file - all levels
        new winston.transports.File({
          filename: path.join(logsDir, 'combined.log'),
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
        // Console output with colors
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
              let metaStr = '';
              if (Object.keys(meta).length > 0) {
                metaStr = `\n${JSON.stringify(meta, null, 2)}`;
              }
              return `${timestamp} [${context}] ${level}: ${message}${metaStr}`;
            })
          ),
        }),
      ],
    });
  }

  /**
   * Log an informational message
   */
  info(message: string, meta?: LogMetadata): void {
    this.winston.info(message, meta);
  }

  /**
   * Log an error message
   */
  error(message: string, meta?: LogMetadata): void {
    this.winston.error(message, meta);
  }

  /**
   * Log a warning message
   */
  warn(message: string, meta?: LogMetadata): void {
    this.winston.warn(message, meta);
  }

  /**
   * Log a debug message
   */
  debug(message: string, meta?: LogMetadata): void {
    this.winston.debug(message, meta);
  }

  /**
   * Measure and log performance of an async operation
   */
  async measurePerformance<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      
      this.info(`Operation completed: ${operation}`, { 
        duration: `${duration}ms`,
        success: true 
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.error(`Operation failed: ${operation}`, {
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      throw error;
    }
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: string): Logger {
    return new Logger(`${this.context}:${additionalContext}`);
  }
}

/**
 * Create a logger instance with the given context
 */
export function createLogger(context: string): Logger {
  return new Logger(context);
}