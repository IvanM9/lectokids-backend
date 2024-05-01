import { PrismaService } from '@/prisma.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateContentDto,
  CreateContentForAllDto,
  MoveContentDto,
} from '../dtos/contents.dto';

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
          type: data.type,
        },
      })
      .catch(() => {
        throw new BadRequestException(
          'Error al agregar contenido a la lectura',
        );
      });

    return { message: `Contenido agregado correctamente a la lectura` };
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

    if (detailReadings.length === 0)
      throw new NotFoundException(
        'No se encontraron lecturas asociadas a la lectura',
      );

    detailReadings.forEach(async (element) => {
      this.create({
        content: data.content,
        detailReadingId: element.id,
        type: data.type,
      });
    });

    return { message: `Contenido agregado correctamente a la lectura` };
  }

  async delete(id: string) {
    await this.db.contentLecture
      .delete({
        where: {
          id,
        },
      })
      .catch(() => {
        throw new BadRequestException('Error al eliminar el contenido');
      });

    return { message: `Contenido eliminado correctamente` };
  }

  async movePosition(data: MoveContentDto) {
    const currentContent = await this.db.contentLecture.findUnique({
      where: {
        id: data.contentLectureId,
      },
    });

    if (!currentContent) {
      throw new NotFoundException('No se encontró el contenido');
    }

    let contentsToUpdate;
    if (data.positionTo > currentContent.positionPage) {
      contentsToUpdate = await this.db.contentLecture.findMany({
        where: {
          detailReading: {
            id: currentContent.detailReadingId,
          },
          positionPage: {
            lte: data.positionTo,
            gte: currentContent.positionPage,
          },
        },
        orderBy: {
          positionPage: 'asc',
        },
      });
    } else {
      contentsToUpdate = await this.db.contentLecture.findMany({
        where: {
          detailReading: {
            id: currentContent.detailReadingId,
          },
          positionPage: {
            gte: data.positionTo,
            lt: currentContent.positionPage,
          },
        },
        orderBy: {
          positionPage: 'asc',
        },
      });
    }

    const lastContent = contentsToUpdate[contentsToUpdate.length - 1];

    if (data.positionTo < 1 || data.positionTo > lastContent.positionPage) {
      throw new BadRequestException('La posición deseada no es válida');
    }

    const updatePromises = contentsToUpdate.map((content) => {
      return this.db.contentLecture.update({
        where: {
          id: content.id,
        },
        data: {
          positionPage:
            content.positionPage +
            (data.positionTo > currentContent.positionPage ? -1 : 1),
        },
      });
    });

    await Promise.all(updatePromises);

    await this.db.contentLecture.update({
      where: {
        id: data.contentLectureId,
      },
      data: {
        positionPage: data.positionTo,
      },
    });

    return { message: 'Contenido movido correctamente' };
  }
}
