import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erro interno do servidor';
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const r = res as Record<string, unknown>;
        message = (r.message as string) ?? message;
        details = r.details;
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);

      // Prisma unique constraint
      if (exception.message.includes('Unique constraint')) {
        status = HttpStatus.CONFLICT;
        message = 'Registro duplicado';
      }
      // Prisma not found
      if (exception.message.includes('Record to update not found') || exception.message.includes('No')) {
        status = HttpStatus.NOT_FOUND;
        message = 'Registro não encontrado';
      }
    }

    response.status(status).json({
      statusCode: status,
      message,
      details,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
