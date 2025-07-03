import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { PaginationInterceptor } from '../interceptors/pagination.interceptor';

/**
 * Decorador que aplica el interceptor de paginación y documenta los parámetros de query en Swagger.
 * 
 * Este decorador combina:
 * - PaginationInterceptor: Para validar y asignar valores por defecto
 * - Documentación de Swagger para los parámetros de paginación
 * 
 * Uso:
 * @ApplyPagination()
 * async getItems(@Query() query: PaginationParams) {
 *   // Los parámetros están validados y documentados
 * }
 */
export function ApplyPagination() {
  return applyDecorators(
    UseInterceptors(PaginationInterceptor),
    ApiQuery({ 
      name: 'page', 
      required: false, 
      type: Number,
      description: 'Número de página (por defecto: 1, mínimo: 1)',
      example: 1
    }),
    ApiQuery({ 
      name: 'limit', 
      required: false, 
      type: Number,
      description: 'Número de elementos por página (por defecto: 10, máximo: 100)',
      example: 10
    }),
    ApiQuery({ 
      name: 'sort', 
      required: false, 
      type: String,
      description: 'Campo de ordenamiento (por defecto: createdAt)',
      example: 'createdAt'
    }),
    ApiQuery({ 
      name: 'order', 
      required: false, 
      enum: ['asc', 'desc'],
      description: 'Dirección del ordenamiento (por defecto: asc)',
      example: 'asc'
    }),
  );
}