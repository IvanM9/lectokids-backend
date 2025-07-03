import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { PAGINATION_DEFAULTS } from '../interfaces/pagination.interface';

/**
 * Interceptor global para validar y asignar valores por defecto a los parámetros de paginación.
 * 
 * Este interceptor maneja automáticamente los siguientes parámetros opcionales:
 * - page: Número de página (por defecto: 1, mínimo: 1)
 * - limit: Número de elementos por página (por defecto: 10, máximo: 100)
 * - sort: Campo de ordenamiento (por defecto: 'createdAt')
 * - order: Dirección del ordenamiento (por defecto: 'asc', valores permitidos: 'asc', 'desc')
 * 
 * Uso:
 * @UseInterceptors(PaginationInterceptor)
 * async getItems(@Query() query: PaginationParams) {
 *   // Los parámetros ya están validados y tienen valores por defecto
 * }
 */
@Injectable()
export class PaginationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const query = request.query;

    // Validar y asignar valores por defecto para page
    if (query.page !== undefined) {
      const page = parseInt(query.page as string, 10);
      if (isNaN(page) || page < 1) {
        throw new BadRequestException('El parámetro "page" debe ser un número entero mayor a 0');
      }
      query.page = page;
    } else {
      query.page = PAGINATION_DEFAULTS.page;
    }

    // Validar y asignar valores por defecto para limit
    if (query.limit !== undefined) {
      const limit = parseInt(query.limit as string, 10);
      if (isNaN(limit) || limit < 1) {
        throw new BadRequestException('El parámetro "limit" debe ser un número entero mayor a 0');
      }
      if (limit > PAGINATION_DEFAULTS.maxLimit) {
        throw new BadRequestException(`El parámetro "limit" no puede ser mayor a ${PAGINATION_DEFAULTS.maxLimit}`);
      }
      query.limit = limit;
    } else {
      query.limit = PAGINATION_DEFAULTS.limit;
    }

    // Validar y asignar valores por defecto para sort
    if (query.sort !== undefined) {
      if (typeof query.sort !== 'string' || query.sort.trim() === '') {
        throw new BadRequestException('El parámetro "sort" debe ser una cadena de texto válida');
      }
      query.sort = query.sort.trim();
    } else {
      query.sort = PAGINATION_DEFAULTS.sort;
    }

    // Validar y asignar valores por defecto para order
    if (query.order !== undefined) {
      const order = (query.order as string).toLowerCase();
      if (order !== 'asc' && order !== 'desc') {
        throw new BadRequestException('El parámetro "order" debe ser "asc" o "desc"');
      }
      query.order = order;
    } else {
      query.order = PAGINATION_DEFAULTS.order;
    }

    return next.handle();
  }
}