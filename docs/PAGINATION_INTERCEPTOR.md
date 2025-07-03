# Interceptor de Paginación

## Descripción

El **PaginationInterceptor** es un interceptor global que valida y asigna valores por defecto a los parámetros opcionales de paginación en las solicitudes HTTP. Este interceptor garantiza que todos los endpoints que manejan paginación tengan un comportamiento consistente y valores seguros.

## Características

- **Validación automática** de parámetros de paginación
- **Asignación de valores por defecto** seguros y consistentes
- **Manejo de errores** con mensajes descriptivos en español
- **Documentación automática** en Swagger
- **Fácil integración** con controladores existentes

## Parámetros Manejados

| Parámetro | Tipo | Por Defecto | Validación | Descripción |
|-----------|------|-------------|------------|-------------|
| `page` | number | 1 | >= 1 | Número de página |
| `limit` | number | 10 | 1-100 | Elementos por página |
| `sort` | string | 'createdAt' | No vacío | Campo de ordenamiento |
| `order` | 'asc' \| 'desc' | 'asc' | asc/desc | Dirección del ordenamiento |

## Configuración por Defecto

```typescript
export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 10,
  maxLimit: 100,
  sort: 'createdAt',
  order: 'asc',
};
```

## Uso Básico

### Opción 1: Usando el decorador `@ApplyPagination()`

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { ApplyPagination } from '@/shared/decorators/pagination.decorator';
import { PaginationParams } from '@/shared/interfaces/pagination.interface';

@Controller('users')
export class UsersController {
  
  @Get()
  @ApplyPagination()
  async getUsers(@Query() pagination: PaginationParams) {
    // Los parámetros ya están validados y tienen valores por defecto
    console.log(pagination.page);  // Siempre será un número >= 1
    console.log(pagination.limit); // Siempre será un número entre 1-100
    console.log(pagination.sort);  // Siempre será una cadena válida
    console.log(pagination.order); // Siempre será 'asc' o 'desc'
    
    return this.service.findAll(pagination);
  }
}
```

### Opción 2: Usando el interceptor directamente

```typescript
import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { PaginationInterceptor } from '@/shared/interceptors/pagination.interceptor';
import { PaginationParams } from '@/shared/interfaces/pagination.interface';

@Controller('products')
export class ProductsController {
  
  @Get()
  @UseInterceptors(PaginationInterceptor)
  async getProducts(@Query() pagination: PaginationParams) {
    return this.service.findAll(pagination);
  }
}
```

## Ejemplos de Solicitudes

### Solicitud sin parámetros
```
GET /api/users
```
**Resultado interno:**
```typescript
{
  page: 1,
  limit: 10,
  sort: 'createdAt',
  order: 'asc'
}
```

### Solicitud con parámetros válidos
```
GET /api/users?page=2&limit=25&sort=name&order=desc
```
**Resultado interno:**
```typescript
{
  page: 2,
  limit: 25,
  sort: 'name',
  order: 'desc'
}
```

### Solicitud con parámetros inválidos
```
GET /api/users?page=0&limit=200&order=invalid
```
**Respuesta:**
```json
{
  "statusCode": 400,
  "message": "El parámetro \"page\" debe ser un número entero mayor a 0",
  "error": "Bad Request"
}
```

## Manejo de Errores

El interceptor valida los parámetros y lanza `BadRequestException` con mensajes descriptivos:

- **page inválido**: "El parámetro \"page\" debe ser un número entero mayor a 0"
- **limit inválido**: "El parámetro \"limit\" debe ser un número entero mayor a 0"
- **limit muy grande**: "El parámetro \"limit\" no puede ser mayor a 100"
- **sort vacío**: "El parámetro \"sort\" debe ser una cadena de texto válida"
- **order inválido**: "El parámetro \"order\" debe ser \"asc\" o \"desc\""

## Integración con Servicios

En tus servicios, puedes utilizar los parámetros validados directamente:

```typescript
import { Injectable } from '@nestjs/common';
import { PaginationParams } from '@/shared/interfaces/pagination.interface';

@Injectable()
export class UsersService {
  
  async findAll(pagination: PaginationParams) {
    const { page, limit, sort, order } = pagination;
    
    // Calcular skip para la paginación
    const skip = (page - 1) * limit;
    
    return this.prisma.user.findMany({
      skip,
      take: limit,
      orderBy: {
        [sort]: order
      }
    });
  }
}
```

## Compatibilidad

Este interceptor es compatible con:
- **NestJS** v8.0+
- **Swagger/OpenAPI** (documentación automática)
- **Bases de datos** que soporten paginación (Prisma, TypeORM, etc.)
- **Controladores existentes** (migración sencilla)

## Migración de Controladores Existentes

Para migrar controladores existentes:

1. **Reemplaza** las declaraciones individuales de `@ApiQuery()` por `@ApplyPagination()`
2. **Elimina** la validación manual de parámetros
3. **Utiliza** la interfaz `PaginationParams` en lugar de parámetros individuales

### Antes:
```typescript
@Get()
@ApiQuery({ name: 'page', required: false })
@ApiQuery({ name: 'limit', required: false })
async getItems(
  @Query('page') page?: number,
  @Query('limit') limit?: number
) {
  const pageNumber = page || 1;
  const limitNumber = limit || 10;
  // ...
}
```

### Después:
```typescript
@Get()
@ApplyPagination()
async getItems(@Query() pagination: PaginationParams) {
  // Los valores ya están validados y asignados
  return this.service.findAll(pagination);
}
```

## Consideraciones

- Los parámetros son **opcionales** en las solicitudes HTTP
- Los valores por defecto **siempre** se asignan si faltan parámetros
- La validación es **estricta** para garantizar la seguridad
- Los mensajes de error están en **español** para consistencia con el proyecto