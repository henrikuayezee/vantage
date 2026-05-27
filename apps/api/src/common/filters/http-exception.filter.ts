import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, unknown>;
        message = (resObj['message'] as string | string[]) ?? message;
        error = (resObj['error'] as string) ?? error;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Unique constraint violation
      if (exception.code === 'P2002') {
        statusCode = HttpStatus.CONFLICT;
        message = 'A record with those details already exists.';
        error = 'Conflict';
      } else if (exception.code === 'P2025') {
        statusCode = HttpStatus.NOT_FOUND;
        message = 'Record not found.';
        error = 'Not Found';
      }
    }

    response.status(statusCode).json({
      statusCode,
      message,
      error,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
