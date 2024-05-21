import { PrismaService } from '@/prisma.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateReadingDto } from '../dtos/readings.dto';

@Injectable()
export class ReadingsService {
  constructor(private db: PrismaService) {}

  async create(data: CreateReadingDto, userId: string) {
    await this.db.level
      .findFirstOrThrow({
        where: {
          course: {
            teacher: {
              userId,
            },
          },
          id: data.levelId,
        },
      })
      .catch(() => {
        throw new BadRequestException(
          'El nivel actual no existe o no le pertenece a este usuario',
        );
      });

    const reading = await this.db.reading
      .create({
        data: {
          goals: data.goals,
          title: data.title,
          length: data.length,
          level: {
            connect: {
              id: data.levelId,
            },
          },
          autogenerate: data.autogenerate,
        },
        select: {
          id: true,
        },
      })
      .catch(() => {
        throw new BadRequestException('No se pudo crear la lectura');
      });

    const students = await this.db.courseStudent.findMany({
      where: {
        course: {
          id: data.courseId,
        },
        status: true,
      },
      select: {
        id: true,
      },
      distinct: 'studentId',
    });

    const dataDetailReading = students.map((student) => {
      return {
        courseStudentId: student.id,
        readingId: reading.id,
        // TODO: Cambiar por el id de la página de inicio
        frontPageId: '1',
      };
    });

    await this.db.detailReading
      .createMany({
        data: dataDetailReading,
      })
      .catch(() => {
        throw new BadRequestException(
          `Hubo errores al crear las lecturas para algunos estudiantes`,
        );
      });

    return { message: 'Lecturas creadas con éxito' };
  }

  async getReadings(userId: string, levelId?: string) {
    return {
      data: await this.db.reading.findMany({
        where: {
          level: {
            id: levelId,
            course: {
              teacher: {
                userId,
              },
            },
          },
        },
      }),
    };
  }

  async getReadingById(readingId: string) {
    const data = await this.db.reading
      .findFirstOrThrow({
        where: { id: readingId },
        select: {
          title: true,
          goals: true,
          length: true,
          detailReadings: {
            select: {
              id: true,
              contentsLecture: {
                select: {
                  id: true,
                  positionPage: true,
                },
                orderBy: {
                  positionPage: 'asc',
                },
              },
              activities: {
                select: {
                  id: true,
                },
              },
              student: {
                select: {
                  id: true,
                  student: {
                    select: {
                      user: {
                        select: {
                          firstName: true,
                          lastName: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          autogenerate: true,
        },
      })
      .catch(() => {
        throw new NotFoundException('No se encontró la lectura');
      });

    return { data };
  }
}
