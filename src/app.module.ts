import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';
import { SecurityModule } from '@/security/security.module';
import { SharedModule } from './shared/shared.module';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { ReadingsModule } from './readings/readings.module';
import { AiModule } from './ai/ai.module';
import { ActivitiesModule } from './activities/activities.module';
import { MultimediaModule } from './multimedia/multimedia.module';
import { AdminModule } from './admin/admin.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import serverConfig from './shared/config/server.config';
import { BullModule } from '@nestjs/bullmq';
import redisConfig from './shared/config/redis.config';
import KeyvRedis, { Keyv } from '@keyv/redis';
import { CacheableMemory } from 'cacheable';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 15,
      },
    ]),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        stores: [
          new Keyv({
            store: new CacheableMemory({ ttl: 6000, lruSize: 5000 }),
          }),
          new KeyvRedis(
            `redis://${configService.get('redis.host')}:${configService.get('redis.port')}`,
          ),
        ],
      }),
      inject: [ConfigService],
      isGlobal: true,
    }),
    SecurityModule,
    SharedModule,
    UsersModule,
    CoursesModule,
    ReadingsModule,
    AiModule,
    ActivitiesModule,
    MultimediaModule,
    AdminModule,
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: [serverConfig, redisConfig],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get('redis.host'),
          port: configService.get('redis.port'),
          username: configService.get('redis.username'),
          password: configService.get('redis.password'),
          tls: configService.get('redis.ssl')
            ? {
                rejectUnauthorized: false,
              }
            : null,
        },
        defaultJobOptions: {
          attempts: 3,
          removeOnComplete: 50,
          removeOnFail: 1000,
        },
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
