import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler, BadRequestException } from '@nestjs/common';
import { PaginationInterceptor } from './pagination.interceptor';
import { of } from 'rxjs';

describe('PaginationInterceptor', () => {
  let interceptor: PaginationInterceptor;
  let mockExecutionContext: Partial<ExecutionContext>;
  let mockCallHandler: Partial<CallHandler>;
  let mockRequest: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaginationInterceptor],
    }).compile();

    interceptor = module.get<PaginationInterceptor>(PaginationInterceptor);

    mockRequest = {
      query: {},
    };

    mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => ({}),
      }),
    } as any;

    mockCallHandler = {
      handle: () => of({}),
    };
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('pagination parameters validation', () => {
    it('should set default values when no query parameters are provided', () => {
      interceptor.intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler);

      expect(mockRequest.query.page).toBe(1);
      expect(mockRequest.query.limit).toBe(10);
      expect(mockRequest.query.sort).toBe('createdAt');
      expect(mockRequest.query.order).toBe('asc');
      expect(mockRequest.query.search).toBeUndefined();
      expect(mockRequest.query.status).toBeUndefined();
    });

    it('should validate and convert valid page parameter', () => {
      mockRequest.query.page = '2';

      interceptor.intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler);

      expect(mockRequest.query.page).toBe(2);
    });

    it('should throw error for invalid page parameter', () => {
      mockRequest.query.page = 'invalid';

      expect(() => {
        interceptor.intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler);
      }).toThrow(BadRequestException);
    });

    it('should throw error for page less than 1', () => {
      mockRequest.query.page = '0';

      expect(() => {
        interceptor.intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler);
      }).toThrow(BadRequestException);
    });

    it('should validate and convert valid limit parameter', () => {
      mockRequest.query.limit = '20';

      interceptor.intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler);

      expect(mockRequest.query.limit).toBe(20);
    });

    it('should throw error for limit greater than maximum', () => {
      mockRequest.query.limit = '200';

      expect(() => {
        interceptor.intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler);
      }).toThrow(BadRequestException);
    });

    it('should validate sort parameter', () => {
      mockRequest.query.sort = 'name';

      interceptor.intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler);

      expect(mockRequest.query.sort).toBe('name');
    });

    it('should throw error for empty sort parameter', () => {
      mockRequest.query.sort = '   ';

      expect(() => {
        interceptor.intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler);
      }).toThrow(BadRequestException);
    });

    it('should validate order parameter', () => {
      mockRequest.query.order = 'desc';

      interceptor.intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler);

      expect(mockRequest.query.order).toBe('desc');
    });

    it('should throw error for invalid order parameter', () => {
      mockRequest.query.order = 'invalid';

      expect(() => {
        interceptor.intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler);
      }).toThrow(BadRequestException);
    });

    it('should handle case insensitive order parameter', () => {
      mockRequest.query.order = 'DESC';

      interceptor.intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler);

      expect(mockRequest.query.order).toBe('desc');
    });

    it('should validate and trim search parameter', () => {
      mockRequest.query.search = '  test search  ';

      interceptor.intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler);

      expect(mockRequest.query.search).toBe('test search');
    });

    it('should remove empty search parameter after trimming', () => {
      mockRequest.query.search = '   ';

      interceptor.intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler);

      expect(mockRequest.query.search).toBeUndefined();
    });

    it('should throw error for non-string search parameter', () => {
      mockRequest.query.search = 123;

      expect(() => {
        interceptor.intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler);
      }).toThrow(BadRequestException);
    });

    it('should convert string "true" to boolean true for status', () => {
      mockRequest.query.status = 'true';

      interceptor.intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler);

      expect(mockRequest.query.status).toBe(true);
    });

    it('should convert string "false" to boolean false for status', () => {
      mockRequest.query.status = 'false';

      interceptor.intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler);

      expect(mockRequest.query.status).toBe(false);
    });

    it('should convert string "1" to boolean true for status', () => {
      mockRequest.query.status = '1';

      interceptor.intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler);

      expect(mockRequest.query.status).toBe(true);
    });

    it('should convert string "0" to boolean false for status', () => {
      mockRequest.query.status = '0';

      interceptor.intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler);

      expect(mockRequest.query.status).toBe(false);
    });

    it('should preserve boolean status parameter', () => {
      mockRequest.query.status = true;

      interceptor.intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler);

      expect(mockRequest.query.status).toBe(true);
    });

    it('should throw error for invalid status parameter', () => {
      mockRequest.query.status = 'invalid';

      expect(() => {
        interceptor.intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler);
      }).toThrow(BadRequestException);
    });
  });
});