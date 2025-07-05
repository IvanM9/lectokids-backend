import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import * as firebase from 'firebase-admin';
import {
  StorageProvider,
  StorageUploadResult,
  StorageDownloadResult,
} from '../interfaces/storage-provider.interface';

@Injectable()
export class FirebaseStorageProvider implements StorageProvider {
  private readonly logger = new Logger(FirebaseStorageProvider.name);

  constructor(
    private readonly bucketName: string,
    private readonly firebaseConfig: string,
  ) {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp({
          credential: firebase.credential.cert(JSON.parse(firebaseConfig)),
        });
      }
    } catch (error) {
      throw new Error(`Failed to initialize Firebase: ${error.message}`);
    }
  }

  async uploadFile(
    filePath: string,
    fileName: string,
    makePublic: boolean = true,
  ): Promise<StorageUploadResult> {
    try {
      const uploaded = await firebase
        .storage()
        .bucket(this.bucketName)
        .upload(filePath, {
          destination: fileName,
          public: makePublic,
        });

      return {
        url: uploaded[0].publicUrl(),
        fileName,
      };
    } catch (error) {
      this.logger.error(error.message, error.stack, FirebaseStorageProvider.name);
      throw new BadRequestException('Error al guardar los archivos en el servidor');
    }
  }

  async downloadFile(fileName: string): Promise<StorageDownloadResult> {
    try {
      const file = await firebase
        .storage()
        .bucket(this.bucketName)
        .file(fileName)
        .download();

      return {
        buffer: file[0],
        name: fileName,
      };
    } catch (error) {
      this.logger.error(error.message, error.stack, FirebaseStorageProvider.name);
      throw new NotFoundException('Multimedia no encontrado');
    }
  }

  async deleteFile(fileName: string): Promise<void> {
    try {
      await firebase
        .storage()
        .bucket(this.bucketName)
        .file(fileName)
        .delete();
    } catch (error) {
      this.logger.error(error.message, error.stack, FirebaseStorageProvider.name);
      throw new BadRequestException('Error al eliminar el archivo');
    }
  }
}