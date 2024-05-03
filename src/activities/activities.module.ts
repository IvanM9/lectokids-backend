import { Module } from '@nestjs/common';
import { ActivitiesController } from './controllers/activities.controller';
import { ActivitiesService } from './services/activities.service';
import { ScoresService } from './services/scores.service';
import { ScoresController } from './controllers/scores.controller';
import { PrismaService } from '@/prisma.service';

@Module({
  controllers: [ActivitiesController, ScoresController],
  providers: [ActivitiesService, ScoresService, PrismaService],
})
export class ActivitiesModule {}
