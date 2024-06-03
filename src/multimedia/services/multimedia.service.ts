import { PrismaService } from '@/prisma.service';
import { ENVIRONMENT } from '@/shared/constants/environment';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TypeMultimedia } from '@prisma/client';
import firebase from 'firebase-admin';
import * as fs from 'fs';

@Injectable()
export class MultimediaService {
  constructor(private db: PrismaService) {
    firebase.initializeApp({
      credential: firebase.credential.cert(
        JSON.parse(ENVIRONMENT.FIREBASE_CONFIG),
      ),
    });
  }

  async createMultimedia(files: Express.Multer.File[], extraData?: any) {
    const uploaded = await Promise.all(
      files.map(async (file) => {
        await firebase
          .storage()
          .bucket(ENVIRONMENT.BUCKET_NAME)
          .upload(file.path, {
            destination: file.filename,
          })
          .catch((e) => {
            console.error(e);
            throw new BadRequestException(
              'Error al guardar los archivos en el servidor',
            );
          });

        // TODO: Revisar la url que se guarda en la base de datos
        const object = {
          url: file.filename,
          type: extraData?.type || TypeMultimedia.IMAGE,
          description: extraData?.description,
        };

        fs.unlink(file.path, (err) => {
          if (err) {
            console.error(err);
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
            console.error(e);
            throw new BadRequestException(
              'Error al guardar los archivos en la base de datos',
            );
          });
      }),
    );

    return { message: 'Multimedia creado con éxito', data: uploaded };
  }

  async deleteMultimedia(id: string) {
    const multimedia = await this.db.multimedia.findUnique({
      where: {
        id,
      },
      select: {
        url: true,
      },
    });

    if (!multimedia) {
      throw new BadRequestException('Multimedia no encontrado');
    }

    await firebase
      .storage()
      .bucket(ENVIRONMENT.BUCKET_NAME)
      .file(multimedia.url)
      .delete()
      .catch((e) => {
        console.error(e);
        throw new BadRequestException('Error al eliminar el archivo');
      });

    await this.db.multimedia
      .delete({
        where: {
          id,
        },
      })
      .catch((e) => {
        console.error(e);
        throw new BadRequestException('Error al eliminar el archivo');
      });

    return { message: 'Multimedia eliminado con éxito' };
  }

  async getMultimedia(id: string) {
    const multimedia = await this.db.multimedia
      .findUniqueOrThrow({
        where: {
          id,
        },
      })
      .catch(() => {
        throw new NotFoundException('Multimedia no encontrado');
      });

    const file = await firebase
      .storage()
      .bucket(ENVIRONMENT.BUCKET_NAME)
      .file(multimedia.url)
      .download()
      .catch(() => {
        throw new NotFoundException('Multimedia no encontrado');
      });

    return { buffer: file[0], name: multimedia.url };
  }
}
