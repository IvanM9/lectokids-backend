import { Module } from '@nestjs/common';
import { ReadingsController } from './controllers/readings.controller';
import { ActivitiesController } from './controllers/activities.controller';
import { ActivitiesService } from './services/activities.service';
import { ReadingsService } from './services/readings.service';

@Module({
  controllers: [ReadingsController, ActivitiesController],
  providers: [ActivitiesService, ReadingsService],
})
export class ReadingsModule {}
