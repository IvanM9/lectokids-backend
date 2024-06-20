import { PrismaService } from '@/prisma.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class DetailsReadingsService {
  constructor(private db: PrismaService) {}

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
}
