import { PrismaService } from '@/prisma.service';
import { ENVIRONMENT } from '@/shared/constants/environment';
import { BadRequestException, Injectable } from '@nestjs/common';
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
}
