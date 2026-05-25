import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

interface ErrorResponse {
  code: number;
  message: string;
  errors?: Record<string, any>;
  timestamp: string;
  path?: string;
}

/**
 * HTTP 异常过滤器
 * 统一处理所有 HTTP 异常
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // 提取错误信息
    let message = exception.message;
    let errors: Record<string, any> | undefined;

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const responseObj = exceptionResponse as any;
      message = responseObj.message || message;
      errors = responseObj.error ? { error: responseObj.error } : undefined;
    }

    const errorResponse: ErrorResponse = {
      code: status,
      message: message || this.getDefaultMessage(status),
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (errors) {
      errorResponse.errors = errors;
    }

    // 记录错误日志
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${status}`,
        exception.stack,
      );
    } else {
      this.logger.warn(`${request.method} ${request.url} - ${status}`);
    }

    response.status(status).json(errorResponse);
  }

  private getDefaultMessage(status: number): string {
    const messages: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: '请求参数错误',
      [HttpStatus.UNAUTHORIZED]: '未授权',
      [HttpStatus.FORBIDDEN]: '禁止访问',
      [HttpStatus.NOT_FOUND]: '资源不存在',
      [HttpStatus.CONFLICT]: '资源冲突',
      [HttpStatus.INTERNAL_SERVER_ERROR]: '服务器内部错误',
      [HttpStatus.SERVICE_UNAVAILABLE]: '服务暂时不可用',
    };
    return messages[status] || '未知错误';
  }
}
