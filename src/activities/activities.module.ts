import { Logger, Module } from '@nestjs/common';
import { ActivitiesController } from './controllers/activities.controller';
import { ActivitiesService } from './services/activities.service';
import { ScoresService } from './services/scores.service';
import { ScoresController } from './controllers/scores.controller';
import { PrismaService } from '@/libs/prisma.service';
import { AiModule } from '@/ai/ai.module';
import { AnswersActivitiesService } from './services/answers-activities.service';
import { QuestionsActivitiesService } from './services/questions-activities.service';
import { AnswersActivitiesController } from './controllers/answers-activities.controller';
import { QuestionsActivitiesController } from './controllers/questions-activities.controller';

@Module({
  controllers: [
    ActivitiesController,
    ScoresController,
    AnswersActivitiesController,
    QuestionsActivitiesController,
  ],
  providers: [
    ActivitiesService,
    ScoresService,
    PrismaService,
    AnswersActivitiesService,
    QuestionsActivitiesService,
    Logger,
  ],
  imports: [AiModule],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
