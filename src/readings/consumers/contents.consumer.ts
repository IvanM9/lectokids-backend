import {
  InjectQueue,
  OnWorkerEvent,
  Processor,
  WorkerHost,
} from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { ContentsService } from '../services/contents.service';
import {
  GenerateContentI,
  GenerateProgressI,
} from '../interfaces/generate-content.interface';
import { ActivitiesService } from '@/activities/services/activities.service';
import { DetailsReadingsService } from '../services/details-readings.service';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { EventEmitter } from 'stream';

@Processor('generate_content')
export class ContentsConsumer extends WorkerHost {
  constructor(
    private service: ContentsService,
    private activitiesService: ActivitiesService,
    private detailReadingService: DetailsReadingsService,
    @InjectQueue('generate_content')
    private generateContentQueue: Queue,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    super();
  }

  eventEmitter = new EventEmitter();

  async process(job: Job<GenerateContentI>, token?: string): Promise<any> {
    switch (job.name) {
      case 'reading':
        await this.service.generateContentsForOneStudent(
          job.data.detailReadingId,
          job.data.numberOfImages,
        );
        break;

      case 'activities':
        await this.activitiesService.generateActivities({
          detailReadingId: job.data.detailReadingId,
          courseStudentId: job.data.courseStudentId,
        });
        break;

      case 'frontpage':
        await this.detailReadingService.updateFrontPage(
          job.data.detailReadingId,
        );
        break;

      default:
        break;
    }
  }

  @OnWorkerEvent('completed')
  async onComplete(job: Job<GenerateContentI>) {
    if (job.name === 'reading') {
      if (job.data.autogenerateActivities) {
        await this.generateContentQueue.add('activities', job.data, {
          priority: 2,
        });
      }

      if (job.data.generateFrontPage) {
        await this.generateContentQueue.add('frontpage', job.data, {
          priority: 3,
        });
      }

      await this.updateProgress(job.data.processId);
    }
  }

  private async updateProgress(processId: string) {
    const currentProgress =
      await this.cacheManager.get<GenerateProgressI>(processId);

    const newProgress = await this.cacheManager.set<GenerateProgressI>(
      processId,
      {
        current: currentProgress.current + 1,
        total: currentProgress.total,
      },
      1000 * 60 * 10,
    );

    if (newProgress.current >= newProgress.total) {
      this.eventEmitter.emit('progressComplete', { processId });
    }
  }
}
