import fs from 'fs';
import { Request, Response, NextFunction } from 'express';

const LOG_FILE = './api.log';

// Ensure log file exists
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, '');
}

const sanitizeHeaders = (headers: Record<string, string>) => {
  const sanitized = {...headers};
  if (sanitized.authorization) {
    sanitized.authorization = '***REDACTED***';
  }
  return sanitized;
};

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      headers: sanitizeHeaders(req.headers as Record<string, string>),
      body: req.body,
    };

    fs.appendFileSync(LOG_FILE, JSON.stringify(logEntry) + '\n');
  });

  next();
};

export const logError = (message: string, error: unknown) => {
  const errorEntry = {
    timestamp: new Date().toISOString(),
    message,
    error: error instanceof Error ? error.stack : error
  };
  fs.appendFileSync(LOG_FILE, JSON.stringify(errorEntry) + '\n');
  console.error(message, error);
};
