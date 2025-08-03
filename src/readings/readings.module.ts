import { Logger, Module } from '@nestjs/common';
import { ReadingsController } from './controllers/readings.controller';
import { ReadingsService } from './services/readings.service';
import { PrismaService } from '@/libs/prisma.service';
import { ContentsService } from './services/contents.service';
import { ContentsController } from './controllers/contents.controller';
import { AiModule } from '@/ai/ai.module';
import { SharedModule } from '@/shared/shared.module';
import { ActivitiesModule } from '@/activities/activities.module';
import { DetailsReadingsService } from './services/details-readings.service';
import { DetailsReadingsController } from './controllers/details-readings.controller';
import { MultimediaModule } from '@/multimedia/multimedia.module';
import { BullModule } from '@nestjs/bullmq';
import { ContentsConsumer } from './consumers/contents.consumer';

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
    ContentsConsumer,
  ],
  imports: [
    AiModule,
    SharedModule,
    ActivitiesModule,
    MultimediaModule,
    BullModule.registerQueue({ name: 'generate_content' }),
  ],
})
export class ReadingsModule {}
