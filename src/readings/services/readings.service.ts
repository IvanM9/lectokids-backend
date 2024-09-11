import { PrismaService } from '@/libs/prisma.service';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateReadingDto, UpdateReadingDto } from '../dtos/readings.dto';
import { AiService } from '@/ai/services/ai/ai.service';
import puppeteer from 'puppeteer';
import { renderFile } from 'ejs';
import { ENVIRONMENT } from '@/shared/constants/environment';
import { TypeContent } from '@prisma/client';

@Injectable()
export class ReadingsService {
  constructor(
    private db: PrismaService,
    private readonly logger: Logger,
    private ai: AiService,
  ) {}

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

    const { reading } = await this.db.$transaction(
      async (dbTransaction: PrismaService) => {
        const reading = await dbTransaction.reading
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

        const studentsId = data.autogenerate
          ? { id: { in: data.students.map((student) => student.id) } }
          : undefined;

        const students = await dbTransaction.courseStudent.findMany({
          where: {
            course: {
              id: data.courseId,
            },
            status: true,
            student: studentsId,
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

        if (data.autogenerate) {
          const createdDetailReading = await dbTransaction.detailReading
            .createManyAndReturn({
              data: students.map(() => ({
                readingId: reading.id,
                numberOfImages: data.numImages,
              })),
              select: {
                id: true,
              },
            })
            .catch((e) => {
              this.logger.error(e.message, e.stack, ReadingsService.name);
              throw new BadRequestException(
                `Hubo errores al crear las lecturas para algunos estudiantes`,
              );
            });

          const studentsOnReadings = students.map((student, index) => ({
            courseStudentId: student.id,
            detailReadingId: createdDetailReading[index].id,
          }));

          await dbTransaction.studentsOnReadings
            .createMany({
              data: studentsOnReadings,
            })
            .catch((e) => {
              this.logger.error(e.message, e.stack, ReadingsService.name);
              throw new BadRequestException(
                `Hubo errores al crear las lecturas para algunos estudiantes`,
              );
            });
        } else {
          await dbTransaction.detailReading
            .create({
              data: {
                readingId: reading.id,
                studentsOnReadings: {
                  createMany: {
                    data: students.map((student) => ({
                      courseStudentId: student.id,
                    })),
                  },
                },
                numberOfImages: data.numImages,
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

        if (data.imageId) {
          await dbTransaction.detailReading.updateMany({
            where: {
              readingId: reading.id,
            },
            data: {
              frontPageId: data.imageId,
            },
          });
        }

        return { reading };
      },
    );

    return { message: 'Lecturas creadas con éxito', data: reading.id };
  }

  async getReadings(userId: string, status?: boolean, levelId?: string) {
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
          status,
        },
        orderBy: {
          createdAt: 'asc',
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
                where: {
                  status: true,
                },
              },
              activities: {
                select: {
                  id: true,
                  typeActivity: true,
                },
                where: {
                  status: true,
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
                orderBy: {
                  courseStudent: {
                    student: {
                      user: {
                        firstName: 'asc',
                      },
                    },
                  },
                },
              },
            },
            where: {
              status: true,
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

  async updateStatusReading(readingId: string, currentUserId: string) {
    const reading = await this.db.reading
      .findFirstOrThrow({
        where: {
          id: readingId,
          level: {
            course: {
              teacher: {
                userId: currentUserId,
              },
            },
          },
        },
        select: {
          status: true,
        },
      })
      .catch(() => {
        throw new NotFoundException('No se encontró la lectura');
      });

    await this.db.reading
      .update({
        where: {
          id: readingId,
        },
        data: {
          status: !reading.status,
        },
      })
      .catch((err) => {
        this.logger.error(err.message, err.stack, ReadingsService.name);
        throw new BadRequestException(
          'Error al actualizar el estado de la lectura',
        );
      });

    return { message: 'Lectura actualizada con éxito' };
  }

  async generateReadingInformation() {
    return { data: await this.ai.generateReadingInformationService() };
  }

  async getPDFReading(readingId: string) {
    const reading = await this.db.reading
      .findFirstOrThrow({
        where: { id: readingId },
        select: {
          title: true,
          goals: true,
          detailReadings: {
            select: {
              contentsLecture: {
                select: {
                  content: true,
                },
                where: {
                  status: true,
                  type: TypeContent.TEXT,
                },
              },
              activities: {
                select: {
                  typeActivity: true,
                  questionActivities: {
                    select: {
                      question: true,
                      answerActivity: {
                        select: {
                          answer: true,
                          isCorrect: true,
                        },
                        where: {
                          status: true,
                        },
                      },
                    },
                    where: {
                      status: true,
                    },
                  },
                },
                where: {
                  status: true,
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
                orderBy: {
                  courseStudent: {
                    student: {
                      user: {
                        firstName: 'asc',
                      },
                    },
                  },
                },
              },
            },
            where: {
              status: true,
            },
          },
        },
      })
      .catch(() => {
        throw new NotFoundException('No se encontró la lectura');
      });

    const readings = [];
    for (const detailReading of reading.detailReadings) {
      const text = detailReading.contentsLecture
        .map((content) => content.content)
        .join(' <br />');

      readings.push({
        text,
        activities: detailReading.activities,
        students: detailReading.studentsOnReadings.map(
          (student) => student.courseStudent.student.user,
        ),
      });
    }

    const data = {
      readings,
      title: reading.title,
      goals: reading.goals,
    };

    return new Promise<Buffer>((resolve, reject) => {
      renderFile(
        ENVIRONMENT.VIEWS_DIR + '/reading.ejs',
        data,
        async (err, html) => {
          if (err) {
            reject(err);
            return;
          }

          const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
          });

          const page = await browser.newPage();

          await page.setContent(html);

          const buffer = await page.pdf({ format: 'A4' });

          await browser.close();

          resolve(buffer);
        },
      );
    });
  }
}
