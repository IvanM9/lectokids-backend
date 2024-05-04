import { Module } from '@nestjs/common';
import { MultimediaService } from './services/multimedia.service';
import { MultimediaController } from './controllers/multimedia.controller';
import { PrismaService } from '@/prisma.service';
import { MulterModule } from '@nestjs/platform-express';
import { CustomFileInterceptor } from './interceptors/custom-file.interceptor';

@Module({
  providers: [MultimediaService, PrismaService],
  controllers: [MultimediaController],
  imports: [
    MulterModule.registerAsync({
      useClass: CustomFileInterceptor,
    }),
  ],
})
export class MultimediaModule {}
