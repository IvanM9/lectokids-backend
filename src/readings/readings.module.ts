import { Module } from '@nestjs/common';
import { ReadingsController } from './controllers/readings.controller';
import { ReadingsService } from './services/readings.service';
import { PrismaService } from '@/prisma.service';
import { ContentsService } from './services/contents.service';
import { ContentsController } from './controllers/contents.controller';
import { AiModule } from '@/ai/ai.module';

@Module({
  controllers: [ReadingsController, ContentsController],
  providers: [ReadingsService, PrismaService, ContentsService],
  imports: [AiModule],
})
export class ReadingsModule {}
