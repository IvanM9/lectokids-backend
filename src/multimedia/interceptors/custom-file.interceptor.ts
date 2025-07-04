import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MulterModuleOptions,
  MulterOptionsFactory,
} from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Injectable()
export class CustomFileInterceptor implements MulterOptionsFactory {
  constructor(private configService: ConfigService) {}

  createMulterOptions(): MulterModuleOptions {
    return {
      storage: diskStorage({
        destination: this.configService.get('multimedia.publicPath'),
        filename: (req, file, cb) => {
          file.originalname = file.originalname.replace(/\s/g, '_');
          const newName = `${file.originalname.split('.')[0]}_${Date.now()}`;
          cb(null, `${newName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const ext = extname(file.originalname);

        const allowedExtensions = [
          '.jpeg',
          '.png',
          '.jpg',
          '.mp4',
          '.mov',
          '.avi',
          '.mkv',
          '.webp',
        ];

        if (!allowedExtensions.includes(ext)) {
          cb(new Error('Sólo se aceptan videos e imágenes'), false);
        } else cb(null, true);
      },
      limits: {
        // fileSize: Environment.FILE_SIZE * 1000000, // Tamaño máximo del archivo (en bytes)
        files: 5, // Número máximo de archivos,
      },
    };
  }
}
