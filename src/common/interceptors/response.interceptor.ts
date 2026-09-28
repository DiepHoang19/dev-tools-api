import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator';
import {
  ApiResponse,
  PaginatedResult,
} from '../interfaces/api-response.interface';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    const response = context.switchToHttp().getResponse<{
      statusCode: number;
    }>();
    const message =
      this.reflector.getAllAndOverride<string>(RESPONSE_MESSAGE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? 'Request completed successfully';

    return next.handle().pipe(
      map((result) => {
        if (this.isPaginatedResult(result)) {
          return {
            data: result.data,
            pagination: result.pagination,
            message,
            statusCode: response.statusCode,
          } as ApiResponse<T>;
        }

        return {
          data: result ?? null,
          message,
          statusCode: response.statusCode,
        } as ApiResponse<T>;
      }),
    );
  }

  private isPaginatedResult(value: unknown): value is PaginatedResult<unknown> {
    return (
      typeof value === 'object' &&
      value !== null &&
      Array.isArray((value as PaginatedResult<unknown>).data) &&
      typeof (value as PaginatedResult<unknown>).pagination === 'object'
    );
  }
}
