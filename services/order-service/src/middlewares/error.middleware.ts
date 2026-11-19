import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(`[AppError ${err.statusCode}] ${err.message}`, err.stack);
    }

    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        statusCode: err.statusCode,
        details: err.details || null,
      },
    });
    return;
  }

  // Unhandled / system errors
  logger.error(`[Unhandled Exception] ${err.message}`, err.stack);

  res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error occurred',
      statusCode: 500,
      details: process.env.NODE_ENV === 'development' ? err.message : null,
    },
  });
}

