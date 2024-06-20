import { AiService } from '@/ai/services/ai/ai.service';
import { PrismaService } from '@/prisma.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TypeContent } from '@prisma/client';

@Injectable()
export class DetailsReadingsService {
  constructor(
    private db: PrismaService,
    private ai: AiService,
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
}
