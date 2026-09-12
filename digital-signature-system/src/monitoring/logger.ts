import * as fs from 'fs';
import * as path from 'path';

interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'TRACE';
  traceId: string;
  spanId: string;
  service: string;
  operation: string;
  message: string;
  data?: Record<string, any>;
  errorStack?: string;
  duration?: number;
}

interface LogConfig {
  logDir: string;
  maxFiles: number;
  maxFileSize: number;
  enableConsole: boolean;
  enableFile: boolean;
  enableRemote: boolean;
  remoteUrl?: string;
}

export class Logger {
  private config: LogConfig;
  private logBuffer: LogEntry[] = [];
  private bufferFlushInterval: any = null;

  constructor(config: Partial<LogConfig> = {}) {
    this.config = {
      logDir: './logs',
      maxFiles: 10,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      enableConsole: true,
      enableFile: true,
      enableRemote: false,
      ...config,
    };

    if (this.config.enableFile) {
      this.ensureLogDir();
    }

    // Flush buffer every 5 seconds
    this.bufferFlushInterval = setInterval((): void => {
      void this.flushBuffer();
    }, 5000) as any;
  }

  private ensureLogDir(): void {
    if (!fs.existsSync(this.config.logDir)) {
      fs.mkdirSync(this.config.logDir, { recursive: true });
    }
  }

  private generateTraceId(): string {
    return `trace-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
  }

  private generateSpanId(): string {
    return `span-${Math.random().toString(36).substring(7).toUpperCase()}`;
  }

  private getCurrentTimestamp(): string {
    return new Date().toISOString();
  }

  private formatLogEntry(entry: LogEntry): string {
    return JSON.stringify({
      timestamp: entry.timestamp,
      level: entry.level,
      traceId: entry.traceId,
      spanId: entry.spanId,
      service: entry.service,
      operation: entry.operation,
      message: entry.message,
      ...(entry.data && { data: entry.data }),
      ...(entry.duration && { duration: `${entry.duration}ms` }),
      ...(entry.errorStack && { errorStack: entry.errorStack }),
    });
  }

  private async writeToFile(entry: LogEntry): Promise<void> {
    try {
      const logFile = path.join(
        this.config.logDir,
        `${entry.level.toLowerCase()}-${new Date().toISOString().split('T')[0]}.log`
      );

      const formattedEntry = this.formatLogEntry(entry);
      fs.appendFileSync(logFile, formattedEntry + '\n');

      // Check file size and rotate if necessary
      this.rotateLogsIfNeeded();
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private rotateLogsIfNeeded(): void {
    try {
      const files = fs.readdirSync(this.config.logDir);
      if (files.length > this.config.maxFiles) {
        files.sort();
        const fileToDelete = files[0];
        fs.unlinkSync(path.join(this.config.logDir, fileToDelete));
      }
    } catch (error) {
      console.error('Failed to rotate logs:', error);
    }
  }

  private async sendToRemote(entry: LogEntry): Promise<void> {
    if (!this.config.enableRemote || !this.config.remoteUrl) {
      return;
    }

    try {
      await fetch(this.config.remoteUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      console.error('Failed to send log to remote:', error);
    }
  }

  private logToConsole(entry: LogEntry): void {
    const colors: Record<string, string> = {
      INFO: '\x1b[36m',    // Cyan
      WARN: '\x1b[33m',    // Yellow
      ERROR: '\x1b[31m',   // Red
      DEBUG: '\x1b[35m',   // Magenta
      TRACE: '\x1b[37m',   // White
    };

    const resetColor = '\x1b[0m';
    const color = colors[entry.level] || resetColor;

    const logMessage = [
      color,
      `[${entry.timestamp}]`,
      `[${entry.level}]`,
      `[${entry.traceId}/${entry.spanId}]`,
      `[${entry.service}::${entry.operation}]`,
      entry.message,
      ...(entry.data ? [`Data:`, JSON.stringify(entry.data, null, 2)] : []),
      ...(entry.duration ? [`Duration: ${entry.duration}ms`] : []),
      resetColor,
    ].join(' ');

    if (entry.level === 'ERROR' && entry.errorStack) {
      console.error(logMessage);
      console.error(entry.errorStack);
    } else if (entry.level === 'WARN') {
      console.warn(logMessage);
    } else if (entry.level === 'DEBUG' || entry.level === 'TRACE') {
      console.debug(logMessage);
    } else {
      console.log(logMessage);
    }
  }

  private async log(
    level: LogEntry['level'],
    operation: string,
    message: string,
    data?: Record<string, any>,
    errorStack?: string,
    duration?: number
  ): Promise<void> {
    const entry: LogEntry = {
      timestamp: this.getCurrentTimestamp(),
      level,
      traceId: data?.traceId || this.generateTraceId(),
      spanId: data?.spanId || this.generateSpanId(),
      service: 'governance-system',
      operation,
      message,
      ...(data && { data }),
      ...(errorStack && { errorStack }),
      ...(duration && { duration }),
    };

    this.logBuffer.push(entry);

    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // Flush immediately for errors
    if (level === 'ERROR') {
      await this.flushBuffer();
    }
  }

  private async flushBuffer(): Promise<void> {
    const entriesToFlush = [...this.logBuffer];
    this.logBuffer = [];

    for (const entry of entriesToFlush) {
      if (this.config.enableFile) {
        await this.writeToFile(entry);
      }

      if (this.config.enableRemote) {
        await this.sendToRemote(entry);
      }
    }
  }

  // Public API
  async info(
    operation: string,
    message: string,
    data?: Record<string, any>
  ): Promise<void> {
    await this.log('INFO', operation, message, data);
  }

  async warn(
    operation: string,
    message: string,
    data?: Record<string, any>
  ): Promise<void> {
    await this.log('WARN', operation, message, data);
  }

  async error(
    operation: string,
    message: string,
    error?: Error,
    data?: Record<string, any>
  ): Promise<void> {
    await this.log('ERROR', operation, message, data, error?.stack);
  }

  async debug(
    operation: string,
    message: string,
    data?: Record<string, any>
  ): Promise<void> {
    await this.log('DEBUG', operation, message, data);
  }

  async trace(
    operation: string,
    message: string,
    data?: Record<string, any>,
    duration?: number
  ): Promise<void> {
    await this.log('TRACE', operation, message, data, undefined, duration);
  }

  async startSpan(
    operation: string,
    fn: (context: { traceId: string; spanId: string }) => Promise<any>
  ): Promise<any> {
    const traceId = this.generateTraceId();
    const spanId = this.generateSpanId();
    const startTime = Date.now();

    try {
      await this.info(operation, 'Span started', { traceId, spanId });
      const result = await fn({ traceId, spanId });
      const duration = Date.now() - startTime;
      await this.trace(operation, 'Span completed', { traceId, spanId }, duration);
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      await this.error(operation, 'Span failed', error, {
        traceId,
        spanId,
        duration,
      });
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    if (this.bufferFlushInterval) {
      clearInterval(this.bufferFlushInterval);
    }
    await this.flushBuffer();
  }

  getLogBuffer(): LogEntry[] {
    return this.logBuffer;
  }

  getLogFile(date: string): string | null {
    try {
      const logFile = path.join(
        this.config.logDir,
        `info-${date}.log`
      );
      if (fs.existsSync(logFile)) {
        return fs.readFileSync(logFile, 'utf-8');
      }
      return null;
    } catch (error) {
      console.error('Failed to read log file:', error);
      return null;
    }
  }
}

export const createLogger = (config?: Partial<LogConfig>): Logger => {
  return new Logger(config);
};

export default new Logger();
