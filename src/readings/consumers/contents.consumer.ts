import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ContentsService } from '../services/contents.service';
import { GenerateContentI } from '../interfaces/generate-content.interface';

@Processor('generate_content')
export class ContentsConsumer extends WorkerHost {
  constructor(private service: ContentsService) {
    super();
  }

  async process(job: Job<GenerateContentI>, token?: string): Promise<any> {
    if (job.name === 'reading') {
      await this.service.generateContent(job.data);
    }
  }
}
