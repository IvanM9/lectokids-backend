import { PrismaService } from '@/prisma.service';
import { ENVIRONMENT } from '@/shared/constants/environment';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { TypeMultimedia } from '@prisma/client';
import firebase from 'firebase-admin';
import * as fs from 'fs';
import { CreateLinkMultimediaDto } from '../dtos/multimedia.dto';
import { Readable } from 'stream';

@Injectable()
export class MultimediaService {
  constructor(
    private db: PrismaService,
    private readonly logger: Logger,
  ) {
    firebase.initializeApp({
      credential: firebase.credential.cert(
        JSON.parse(ENVIRONMENT.FIREBASE_CONFIG),
      ),
    });
  }

  async createMultimedia(files: Express.Multer.File[], extraData?: any) {
    const uploaded = await Promise.all(
      files.map(async (file) => {
        const uploaded = await firebase
          .storage()
          .bucket(ENVIRONMENT.BUCKET_NAME)
          .upload(file.path, {
            destination: file.filename,
            public: true,
          })
          .catch((e) => {
            this.logger.error(e.message, e.stack, MultimediaService.name);
            throw new BadRequestException(
              'Error al guardar los archivos en el servidor',
            );
          });

        const object = {
          url: uploaded[0].publicUrl(),
          fileName: file.filename,
          type: extraData?.type ?? TypeMultimedia.IMAGE,
          description: extraData?.description,
        };

        fs.unlink(file.path, (err) => {
          if (err) {
            this.logger.error(err.message, err.stack, MultimediaService.name);
          }
        });

        return await this.db.multimedia
          .create({
            data: object,
            select: {
              id: true,
            },
          })
          .catch((e) => {
            this.logger.error(e.message, e.stack, MultimediaService.name);
            throw new BadRequestException(
              'Error al guardar los archivos en la base de datos',
            );
          });
      }),
    );

    return { message: 'Multimedia creado con éxito', data: uploaded };
  }

  async createMultimediaFromBase64(base64: string, extraData?: any) {
    const buffer = Buffer.from(base64, 'base64');
    const fileName = `image_generate_${Date.now()}.webp`;
    fs.writeFileSync(`${ENVIRONMENT.PUBLIC_DIR}/${fileName}`, buffer);

    return await this.createMultimedia(
      [
        {
          buffer,
          originalname: fileName,
          mimetype: 'image/webp',
          fieldname: 'files',
          encoding: '7bit',
          size: 0,
          stream: new Readable(),
          destination: ENVIRONMENT.PUBLIC_DIR,
          filename: fileName,
          path: `${ENVIRONMENT.PUBLIC_DIR}/${fileName}`,
        },
      ],
      {
        type: extraData?.type ?? TypeMultimedia.IMAGE,
        description: extraData?.description,
      },
    );
  }

  async deleteMultimedia(id: string) {
    const multimedia = await this.db.multimedia
      .findUniqueOrThrow({
        where: {
          id,
        },
        select: {
          fileName: true,
        },
      })
      .catch(() => {
        throw new NotFoundException('Multimedia no encontrado');
      });

    if (multimedia.fileName) {
      await firebase
        .storage()
        .bucket(ENVIRONMENT.BUCKET_NAME)
        .file(multimedia.fileName)
        .delete()
        .catch((e) => {
          this.logger.error(e.message, e.stack, MultimediaService.name);
          throw new BadRequestException('Error al eliminar el archivo');
        });
    }

    await this.db.multimedia
      .delete({
        where: {
          id,
        },
      })
      .catch((e) => {
        this.logger.error(e.message, e.stack, MultimediaService.name);
        throw new BadRequestException('Error al eliminar el archivo');
      });

    return { message: 'Multimedia eliminado con éxito' };
  }

  async downloadMultimedia(id: string) {
    const multimedia = await this.db.multimedia
      .findUniqueOrThrow({
        where: {
          id,
          fileName: {
            not: null,
          },
        },
      })
      .catch(() => {
        throw new NotFoundException(
          'Multimedia no encontrado o no es descargable',
        );
      });

    const file = await firebase
      .storage()
      .bucket(ENVIRONMENT.BUCKET_NAME)
      .file(multimedia.fileName)
      .download()
      .catch((err) => {
        this.logger.error(err.message, err.stack, MultimediaService.name);
        throw new NotFoundException('Multimedia no encontrado');
      });

    return { buffer: file[0], name: multimedia.url };
  }

  async getMultimedia(id: string) {
    const multimedia = await this.db.multimedia
      .findUniqueOrThrow({
        where: {
          id,
        },
        select: {
          url: true,
          type: true,
          description: true,
        },
      })
      .catch(() => {
        throw new NotFoundException('Multimedia no encontrado');
      });

    return { data: multimedia };
  }

  async uploadUrl(payload: CreateLinkMultimediaDto) {
    const uploaded = await this.db.multimedia
      .create({
        data: {
          url: payload.url,
          type: payload.type ?? TypeMultimedia.IMAGE,
          description: payload.description,
        },
        select: {
          id: true,
        },
      })
      .catch((e) => {
        throw new BadRequestException(
          'Error al guardar los archivos en la base de datos',
        );
      });

    return { message: 'Multimedia creado con éxito', data: uploaded };
  }
}
