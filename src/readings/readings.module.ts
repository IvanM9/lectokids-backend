import { Module } from '@nestjs/common';
import { ReadingsController } from './controllers/readings.controller';
import { ActivitiesController } from './controllers/activities.controller';
import { ActivitiesService } from './services/activities.service';
import { ReadingsService } from './services/readings.service';
import { PrismaService } from '@/prisma.service';
import { ContentsService } from './services/contents.service';
import { ContentsController } from './controllers/contents.controller';

@Module({
  controllers: [ReadingsController, ActivitiesController, ContentsController],
  providers: [ActivitiesService, ReadingsService, PrismaService, ContentsService],
})
export class ReadingsModule {}
