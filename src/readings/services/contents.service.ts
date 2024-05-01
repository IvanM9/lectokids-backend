import { PrismaService } from '@/prisma.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateContentDto, CreateContentForAllDto } from '../dtos/contents.dto';

@Injectable()
export class ContentsService {
  constructor(private db: PrismaService) {}

  async create(data: CreateContentDto) {
    const position = await this.db.contentLecture.count({
      where: { detailReading: { id: data.detailReadingId } },
    });

    await this.db.contentLecture
      .create({
        data: {
          content: data.content,
          positionPage: position + 1,
          detailReading: {
            connect: {
              id: data.detailReadingId,
            },
          },
        },
      })
      .catch(() => {
        throw new BadRequestException(
          'Error al agregar contenido a la lectura',
        );
      });
  }

  async createSameForAll(data: CreateContentForAllDto) {
    const detailReadings = await this.db.detailReading.findMany({
      where: {
        readingId: data.readingId,
      },
      select: {
        id: true,
      },
    });

    detailReadings.forEach(async (element) => {
      this.create({
        content: data.content,
        detailReadingId: element.id,
      });
    });

    return { message: `Contenido agregado correctamente a la lectura` };
  }

  //   async addContent(){

  //   }
}
