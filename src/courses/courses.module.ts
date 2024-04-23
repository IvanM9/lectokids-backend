import { Module } from '@nestjs/common';
import { CoursesController } from './controllers/courses.controller';
import { LevelsController } from './controllers/levels.controller';
import { LevelsService } from './services/levels.service';
import { CoursesService } from './services/courses.service';
import { PrismaService } from '@/prisma.service';

@Module({
  controllers: [CoursesController, LevelsController],
  providers: [LevelsService, CoursesService, PrismaService],
})
export class CoursesModule {}
