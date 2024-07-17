import { Logger, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DateFormatInterceptor } from './interceptors/date-format.interceptor';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './controllers/health.controller';
import { PrismaService } from '@/libs/prisma.service';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: DateFormatInterceptor,
    },
    PrismaService,
  ],
  imports: [
    TerminusModule.forRoot({
      logger: Logger,
    }),
  ],
  controllers: [HealthController],
})
export class SharedModule {}
