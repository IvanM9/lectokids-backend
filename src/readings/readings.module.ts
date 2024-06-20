import { Logger, Module } from '@nestjs/common';
import { ReadingsController } from './controllers/readings.controller';
import { ReadingsService } from './services/readings.service';
import { PrismaService } from '@/prisma.service';
import { ContentsService } from './services/contents.service';
import { ContentsController } from './controllers/contents.controller';
import { AiModule } from '@/ai/ai.module';
import { ActivitiesModule } from '@/activities/activities.module';
import { DetailsReadingsService } from './services/details-readings.service';
import { DetailsReadingsController } from './controllers/details-readings.controller';

@Module({
  controllers: [
    ReadingsController,
    ContentsController,
    DetailsReadingsController,
  ],
  providers: [
    ReadingsService,
    PrismaService,
    ContentsService,
    Logger,
    DetailsReadingsService,
  ],
  imports: [AiModule, ActivitiesModule],
})
export class ReadingsModule {}
