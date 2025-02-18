import { Logger, Module } from '@nestjs/common';
import { MultimediaService } from './services/multimedia.service';
import { MultimediaController } from './controllers/multimedia.controller';
import { PrismaService } from '@/libs/prisma.service';
import { MulterModule } from '@nestjs/platform-express';
import { CustomFileInterceptor } from './interceptors/custom-file.interceptor';
import { ConfigModule } from '@nestjs/config';
import multimediaConfig from './config/multimedia.config';

@Module({
  providers: [MultimediaService, PrismaService, Logger],
  controllers: [MultimediaController],
  imports: [
    MulterModule.registerAsync({
      useClass: CustomFileInterceptor,
    }),
    ConfigModule.forFeature(multimediaConfig),
  ],
  exports: [MultimediaService],
})
export class MultimediaModule {}
