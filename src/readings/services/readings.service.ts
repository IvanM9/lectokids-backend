import { PrismaService } from '@/prisma.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateReadingDto, UpdateReadingDto } from '../dtos/readings.dto';

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

    const { reading, students } = await this.db.$transaction(async (db) => {
      const reading = await db.reading
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

      const students = await db.courseStudent.findMany({
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

      if (students.length === 0) {
        throw new BadRequestException(
          'No se pudo registrar la lectura porque no hay estudiantes en el curso',
        );
      }

      return { reading, students };
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
      await this.db.detailReading
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
            studentsOnReadings: {
              createMany: {
                data: students.map((student) => ({
                  courseStudentId: student.id,
                })),
              },
            },
          },
          select: {
            id: true,
          },
        })
        .catch((error) => {
          console.log(error);
          throw new BadRequestException('No se pudo crear la lectura');
        });
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
                  typeActivity: true,
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
          customPrompt: true,
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

  async updateReading(
    readingId: string,
    data: UpdateReadingDto,
    userId: string,
  ) {
    await this.db.reading
      .findFirstOrThrow({
        where: {
          id: readingId,
          level: {
            course: {
              teacher: {
                userId,
              },
            },
          },
        },
      })
      .catch(() => {
        throw new BadRequestException(
          'La lectura no existe o no le pertenece a este usuario',
        );
      });

    const reading = await this.db.reading
      .update({
        where: { id: readingId },
        data: {
          goals: data.goals,
          title: data.title,
          length: data.length,
          customPrompt: data.customPrompt,
        },
        select: {
          id: true,
        },
      })
      .catch(() => {
        throw new BadRequestException('No se pudo actualizar la lectura');
      });

    return { message: 'Lectura actualizada con éxito', data: reading.id };
  }
}
