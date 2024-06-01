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
          customPrompt: data.customPrompt,
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

    if (data.autogenerate) {
      for (const student of students) {
        await this.db.detailReading
          .create({
            data: {
              reading: {
                connect: {
                  id: reading.id,
                },
              },
              studentsOnReadings: {
                create: {
                  courseStudent: {
                    connect: {
                      id: student.id,
                    },
                  },
                },
              },
              frontPage: {
                connect: {
                  id: data.imageId,
                },
              },
            },
          })
          .catch(() => {
            throw new BadRequestException(
              `Hubo errores al crear las lecturas para algunos estudiantes`,
            );
          });
      }
    } else {
      const detailReadingCreated = await this.db.detailReading
        .create({
          data: {
            reading: {
              connect: {
                id: reading.id,
              },
            },
            frontPage: {
              connect: {
                id: data.imageId,
              },
            },
          },
          select: {
            id: true,
          },
        })
        .catch(() => {
          throw new BadRequestException('No se pudo crear la lectura');
        });

      for (const student of students) {
        await this.db.studentsOnReadings
          .create({
            data: {
              detailReading: {
                connect: {
                  id: detailReadingCreated.id,
                },
              },
              courseStudent: {
                connect: {
                  id: student.id,
                },
              },
            },
          })
          .catch(() => {
            throw new BadRequestException(
              `Hubo errores al crear las lecturas para algunos estudiantes`,
            );
          });
      }
    }

    return { message: 'Lecturas creadas con éxito', data: reading.id };
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
                },
              },
              activities: {
                select: {
                  id: true,
                },
              },
              studentsOnReadings: {
                select: {
                  courseStudent: {
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
            },
          },
          autogenerate: true,
        },
      })
      .catch(() => {
        throw new NotFoundException('No se encontró la lectura');
      });

    if (!data.autogenerate) {
      data.detailReadings = [
        {
          contentsLecture: data.detailReadings[0].contentsLecture,
          activities: data.detailReadings[0].activities,
          studentsOnReadings: undefined,
          id: data.detailReadings[0].id,
        },
      ];
    }

    return { data };
  }
}
