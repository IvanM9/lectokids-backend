import { Logger, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DateFormatInterceptor } from './interceptors/date-format.interceptor';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './controllers/health.controller';
import { PrismaService } from '@/libs/prisma.service';
import { ConfigModule } from '@nestjs/config';
import serverConfig from './config/server.config';
import { PuppeteerPoolService } from './services/puppeteer-pool.service';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: DateFormatInterceptor,
    },
    PrismaService,
    PuppeteerPoolService,
  ],
  imports: [
    TerminusModule.forRoot({
      logger: Logger,
    }),
  ],
  controllers: [HealthController],
  exports: [PuppeteerPoolService],
})
export class SharedModule {}
