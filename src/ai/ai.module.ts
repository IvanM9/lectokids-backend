import { Logger, Module } from '@nestjs/common';
import { AiService } from './services/ai/ai.service';
import { MultimediaModule } from '@/multimedia/multimedia.module';
import { AiController } from './ai.controller';
import { ConfigModule } from '@nestjs/config';
import aiConfig from './config/ai.config';
import googleVertexConfig from './config/providers/google-vertex.config';

@Module({
  providers: [AiService, Logger],
  exports: [AiService],
  imports: [
    MultimediaModule,
    ConfigModule.forFeature(aiConfig),
    ConfigModule.forFeature(googleVertexConfig),
  ],
  controllers: [AiController],
})
export class AiModule {}
