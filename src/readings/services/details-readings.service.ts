import { AiService } from '@/ai/services/ai/ai.service';
import { PrismaService } from '@/libs/prisma.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TypeContent } from '@prisma/client';
import { CreateTimeSpendDto } from '../dtos/readings.dto';
import { MultimediaService } from '@/multimedia/services/multimedia.service';

@Injectable()
export class DetailsReadingsService {
  constructor(
    private db: PrismaService,
    private ai: AiService,
    private multimediaService: MultimediaService,
  ) {}

  async getInfo(detailReadingId: string) {
    const detailReading = await this.db.detailReading
      .findUnique({
        where: {
          id: detailReadingId,
        },
        select: {
          reading: {
            select: {
              id: true,
              title: true,
            },
          },
          frontPage: {
            select: {
              id: true,
              url: true,
            },
          },
        },
      })
      .catch(() => {
        throw new NotFoundException('Detalle de lectura no encontrado');
      });

    return { data: detailReading };
  }

  async updateFrontPage(detailReadingId: string) {
    const detailReading = await this.db.detailReading
      .findUnique({
        where: {
          id: detailReadingId,
        },
        select: {
          reading: {
            select: {
              id: true,
              title: true,
            },
          },
          frontPage: {
            select: {
              id: true,
              url: true,
            },
          },
          contentsLecture: {
            select: {
              content: true,
            },
            where: {
              type: TypeContent.TEXT,
            },
          },
        },
      })
      .catch(() => {
        throw new NotFoundException('Detalle de lectura no encontrado');
      });

    if (detailReading.frontPage) {
      return { data: null };
    }

    const textReading = detailReading.contentsLecture
      .map((content) => content.content)
      .join('\n');

    const imageId = (await this.ai.generateFrontPage(textReading)).data;

    await this.db.detailReading.update({
      where: {
        id: detailReadingId,
      },
      data: {
        frontPage: {
          connect: {
            id: imageId,
          },
        },
      },
    });

    return { message: 'Portada actualizada correctamente' };
  }

  async saveTimeSpentReading(
    { detailReadingId, startTime, endTime }: CreateTimeSpendDto,
    userId,
  ) {
    const { courseStudent } = await this.db.studentsOnReadings
      .findFirstOrThrow({
        where: {
          detailReadingId,
          courseStudent: {
            student: {
              userId,
            },
          },
        },
        select: {
          courseStudent: {
            select: {
              id: true,
            },
          },
        },
      })
      .catch(() => {
        throw new NotFoundException('No se encontró el estudiante');
      });

    await this.db.detailReading
      .findFirstOrThrow({
        where: {
          id: detailReadingId,
          studentsOnReadings: {
            some: {
              courseStudentId: courseStudent.id,
            },
          },
        },
      })
      .catch(() => {
        throw new NotFoundException('No se encontró la lectura');
      });

    await this.db.timeSpend
      .create({
        data: {
          detailReading: {
            connect: {
              id: detailReadingId,
            },
          },
          courseStudent: {
            connect: {
              id: courseStudent.id,
            },
          },
          startTime,
          endTime,
        },
      })
      .catch(() => {
        throw new BadRequestException(
          'No se pudo guardar el tiempo de lectura',
        );
      });

    return { message: 'Tiempo de lectura registrado con éxito' };
  }

  // async getAudio(detailReadingId: string) {
  //   const detailReading = await this.db.detailReading
  //     .findUniqueOrThrow({
  //       where: {
  //         id: detailReadingId,
  //       },
  //       select: {
  //         audio: {
  //           select: {
  //             id: true,
  //           },
  //         },
  //         contentsLecture: {
  //           select: {
  //             content: true,
  //           },
  //           where: {
  //             type: TypeContent.TEXT,
  //             status: true,
  //           },
  //           orderBy: {
  //             createdAt: 'asc',
  //           },
  //         },
  //       },
  //     })
  //     .catch(() => {
  //       throw new NotFoundException('Detalle de lectura no encontrado');
  //     });

  //   let audioId = null;
  //   if (!detailReading.audio) {
  //     const textReading = detailReading.contentsLecture
  //       .map((content) => content.content)
  //       .join('\n');
  //     audioId = await this.ai.generateSpeechService(textReading);

  //     await this.db.detailReading
  //       .update({
  //         where: {
  //           id: detailReadingId,
  //         },
  //         data: {
  //           audio: {
  //             connect: {
  //               id: audioId,
  //             },
  //           },
  //         },
  //       })
  //       .catch(() => {
  //         throw new BadRequestException('No se pudo guardar el audio');
  //       });
  //   } else {
  //     audioId = detailReading.audio.id;
  //   }

  //   return await this.multimediaService.downloadMultimedia(audioId);
  // }
}
