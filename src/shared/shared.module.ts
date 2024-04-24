import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DateFormatInterceptor } from './interceptors/date-format.interceptor';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: DateFormatInterceptor,
    },
  ],
})
export class SharedModule {}
