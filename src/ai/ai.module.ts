import { Module } from '@nestjs/common';
import { AiService } from './services/ai/ai.service';

@Module({
  providers: [AiService],
})
export class AiModule {}
