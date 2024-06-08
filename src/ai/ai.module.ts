import { Logger, Module } from '@nestjs/common';
import { AiService } from './services/ai/ai.service';

@Module({
  providers: [AiService, Logger],
  exports: [AiService],
})
export class AiModule {}
