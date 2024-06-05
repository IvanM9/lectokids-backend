import { PrismaService } from '@/prisma.service';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateContentDto,
  CreateContentForAllDto,
  UpdateContentDto,
} from '../dtos/contents.dto';
import { AiService } from '@/ai/services/ai/ai.service';
import { TypeContent } from '@prisma/client';

@Injectable()
export class ContentsService {
  constructor(
    private db: PrismaService,
    private ai: AiService,
  ) {}

  async create(data: CreateContentDto) {
    await this.db.contentLecture
      .create({
        data: {
          content: data.content,
          detailReading: {
            connect: {
              id: data.detailReadingId,
            },
          },
          type: data.type,
          createdAt: new Date(),
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

    for (const element of detailReadings) {
      await this.create({
        content: data.content,
        detailReadingId: element.id,
        type: data.type,
      });
    }

    return { message: `Contenido agregado correctamente a la lectura` };
  }

  async delete(id: string) {
    await this.db.contentLecture
      .findUniqueOrThrow({
        where: {
          id,
        },
      })
      .catch(() => {
        throw new NotFoundException('No se encontró el contenido');
      });

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

  async update(contentId: string, content: UpdateContentDto) {
    await this.db.contentLecture
      .findUniqueOrThrow({
        where: {
          id: contentId,
        },
      })
      .catch(() => {
        throw new NotFoundException('No se encontró el contenido');
      });

    await this.db.contentLecture.update({
      where: {
        id: contentId,
      },
      data: {
        content: content.content,
        type: content.type,
      },
    });

    return { message: 'Contenido actualizado correctamente' };
  }

  async getContentsByDetailReadingId(detailReadingId: string) {
    const contents = await this.db.contentLecture.findMany({
      where: {
        detailReading: {
          id: detailReadingId,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const student = await this.db.student.findFirstOrThrow({
      select: {
        haveDyslexia: true,
      },
      where: {
        coursesStudent: {
          some: {
            studentsOnReadings: {
              some: {
                detailReadingId,
              },
            },
          },
        },
      },
    });

    return {
      data: { contents, haveDyslexia: student.haveDyslexia },
    };
  }

  async getContentById(contentId: string) {
    const content = await this.db.contentLecture
      .findUniqueOrThrow({
        where: {
          id: contentId,
        },
      })
      .catch(() => {
        throw new NotFoundException('No se encontró el contenido');
      });

    return { data: content };
  }

  async createCustomReading(readingId: string) {
    const students = await this.db.studentsOnReadings.findMany({
      select: {
        courseStudent: {
          select: {
            student: {
              select: {
                city: true,
                comprensionLevelHistory: {
                  select: {
                    level: true,
                  },
                },
                user: {
                  select: {
                    genre: true,
                    birthDate: true,
                  },
                },
                interests: true,
              },
            },
            customPrompt: true,
            grade: true,
            problems: true,
          },
        },
        detailReading: {
          select: {
            id: true,
            reading: {
              select: {
                title: true,
                goals: true,
                length: true,
                customPrompt: true,
              },
            },
          },
        },
      },
      where: {
        detailReading: {
          reading: {
            id: readingId,
          },
        },
      },
    });

    await this.createParamsCustomReading(students);

    return {
      message: `Contenido agregado correctamente a las lecturas`,
    };
  }

  private async createParamsCustomReading(students: any[]) {
    for (const student of students) {
      let comprehensionLevel = null;
      for (const element of student.courseStudent.student
        .comprensionLevelHistory) {
        comprehensionLevel += `${element.level}, `;
      }

      const params = {
        age:
          new Date().getFullYear() -
          student.courseStudent.student.user.birthDate.getFullYear(),
        title: student.detailReading.reading.title,
        goals: student.detailReading.reading.goals,
        length: student.detailReading.reading.length,
        comprehensionLevel,
        interests: student.courseStudent.student.interests,
        city: student.courseStudent.student.city,
        problems: student.courseStudent.problems,
        preferences: student.courseStudent.customPrompt,
        genre: student.courseStudent.student.user.genre,
        grade: student.courseStudent.grade,
        customPrompt: student.detailReading.reading.customPrompt,
      };

      try {
        let exit = false;
        let contents = null;

        while (!exit) {
          const reading = await this.ai.generateReadingService(params);

          try {
            contents = JSON.parse(reading);
            exit = true;
          } catch {
            exit = false;
          }
        }

        for (const element of contents) {
          await this.create({
            content: element.content,
            detailReadingId: student.detailReading.id,
            type: TypeContent.TEXT,
          });
        }
      } catch (error) {
        console.error(error);
        throw new InternalServerErrorException(
          'Error al generar la lectura. Por favor, intente nuevamente.',
        );
      }
    }
  }
}
