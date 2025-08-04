import { Logger, Module } from '@nestjs/common';
import { MultimediaService } from './services/multimedia.service';
import { MultimediaController } from './controllers/multimedia.controller';
import { PrismaService } from '@/libs/prisma.service';
import { MulterModule } from '@nestjs/platform-express';
import { CustomFileInterceptor } from './interceptors/custom-file.interceptor';
import { ConfigModule } from '@nestjs/config';
import multimediaConfig from './config/multimedia.config';
import { StorageProviderFactory } from './providers/storage-provider.factory';
import firebaseConfig from './config/firebase.config';
import minioConfig from './config/minio.config';

@Module({
  providers: [MultimediaService, PrismaService, Logger, StorageProviderFactory],
  controllers: [MultimediaController],
  imports: [
    MulterModule.registerAsync({
      useClass: CustomFileInterceptor,
    }),
    ConfigModule.forFeature(multimediaConfig),
    ConfigModule.forFeature(firebaseConfig),
    ConfigModule.forFeature(minioConfig),
  ],
  exports: [MultimediaService],
})
export class MultimediaModule {}
