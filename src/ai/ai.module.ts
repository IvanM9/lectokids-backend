import { Logger, Module } from '@nestjs/common';
import { AiService } from './services/ai/ai.service';
import { MultimediaModule } from '@/multimedia/multimedia.module';
import { AiController } from './ai.controller';

@Module({
  providers: [AiService, Logger],
  exports: [AiService],
  imports: [MultimediaModule],
  controllers: [AiController],
})
export class AiModule {}
