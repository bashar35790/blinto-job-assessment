import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  DUPLICATE_TITLE = 'DUPLICATE_TITLE',
  DUPLICATE_NAME = 'DUPLICATE_NAME',
  CIRCULAR_DEPENDENCY = 'CIRCULAR_DEPENDENCY',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
}

export interface ErrorResponse {
  error: ErrorCode;
  message: string;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;

  constructor(statusCode: number, code: ErrorCode, message: string) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

function formatZodError(error: ZodError): string {
  const issue = error.issues[0];

  if (!issue) {
    return 'Invalid request payload';
  }

  const path = issue.path.join('.');
  return path ? `${path}: ${issue.message}` : issue.message;
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: error.code,
      message: error.message,
    } satisfies ErrorResponse);
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      error: ErrorCode.VALIDATION_ERROR,
      message: formatZodError(error),
    } satisfies ErrorResponse);
    return;
  }

  console.error('Unhandled error:', error);
  res.status(500).json({
    error: ErrorCode.INTERNAL_SERVER_ERROR,
    message: 'Internal server error',
  } satisfies ErrorResponse);
}
