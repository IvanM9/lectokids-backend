import { PrismaService } from '@/prisma.service';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import {
  CreateContentDto,
  CreateContentForAllDto,
  UpdateContentDto,
} from '../dtos/contents.dto';
import { AiService } from '@/ai/services/ai/ai.service';
import { TypeContent } from '@prisma/client';
import { ActivitiesService } from '@/activities/services/activities.service';
import { GenerateReadingDto } from '@/ai/ai.dto';
import { DetailsReadingsService } from './details-readings.service';

@Injectable()
export class ContentsService {
  constructor(
    private db: PrismaService,
    private ai: AiService,
    private activitiesService: ActivitiesService,
    private detailReadingService: DetailsReadingsService,
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

  async getContentsByDetailReadingId(
    detailReadingId: string,
    status?: boolean,
  ) {
    const reading = await this.db.detailReading
      .findUniqueOrThrow({
        where: {
          id: detailReadingId,
        },
        select: {
          reading: {
            select: {
              title: true,
            },
          },
        },
      })
      .catch(() => {
        throw new NotFoundException('No se encontró la lectura');
      });

    const contents = await this.db.contentLecture.findMany({
      where: {
        detailReading: {
          id: detailReadingId,
        },
        status,
      },
      select: {
        id: true,
        content: true,
        type: true,
        image: {
          select: {
            id: true,
            url: true,
          },
        }
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const student = await this.db.student
      .findFirstOrThrow({
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
      })
      .catch(() => {
        throw new NotFoundException('No se encontró el estudiante');
      });

    return {
      data: {
        contents,
        haveDyslexia: student.haveDyslexia,
        title: reading.reading.title,
      },
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

  async createCustomReadingForAll(readingId: string) {
    const students = await this.db.studentsOnReadings.findMany({
      select: {
        courseStudent: {
          select: {
            id: true,
          },
        },
        detailReading: {
          select: {
            id: true,
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

    for (const student of students) {
      await this.generateContentsForOneStudent(student.detailReading.id);

      await this.activitiesService.generateActivities({
        detailReadingId: student.detailReading.id,
        courseStudentId: student.courseStudent.id,
      });

      await this.detailReadingService.updateFrontPage(student.detailReading.id);
    }
    return {
      message: `Contenido agregado correctamente a las lecturas`,
    };
  }

  async generateContentsForOneStudent(detailReadingId: string) {
    const student = await this.db.studentsOnReadings
      .findFirstOrThrow({
        where: {
          detailReadingId,
        },
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
              id: true,
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
      })
      .catch(() => {
        throw new NotFoundException('No se encontró el estudiante');
      });

    let comprehensionLevel = null;
    for (const element of student.courseStudent.student
      .comprensionLevelHistory) {
      comprehensionLevel += `${element.level}, `;
    }

    const params: GenerateReadingDto = {
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

    const contents: any[] = await this.ai.generateReadingService(params);

    let numberOfImages = Math.floor(Math.random() * (4 - 2 + 1)) + 2;
    let index = 0;
    for (const element of contents) {
      await this.create({
        content: element.content,
        detailReadingId: student.detailReading.id,
        type: TypeContent.TEXT,
      }).catch(() => {
        throw new InternalServerErrorException(
          'Error al agregar contenido a la lectura',
        );
      });

      if (index % 2 === 0 && numberOfImages-- > 0) {
        await this.generateImageForContent(
          element.content,
          student.detailReading.id,
        );
      }

      index++;
    }

    return {
      message: `Contenido agregado correctamente a la lectura`,
    };
  }

  private async generateImageForContent(
    content: string,
    detailReadingId: string,
  ) {
    const imageId = (await this.ai.generateFrontPage(content)).data;

    await this.db.contentLecture
      .create({
        data: {
          image: {connect: {id: imageId}},
          detailReading: {
            connect: {
              id: detailReadingId,
            },
          },
          type: TypeContent.IMAGE,
        },
      })
      .catch(() => {
        throw new InternalServerErrorException(
          'Error al agregar contenido a la lectura',
        );
      });
  }

  async generateContentsByDetailReading(detailReadingId: string) {
    const reading = await this.db.reading.findFirstOrThrow({
      where: {
        detailReadings: {
          some: {
            id: detailReadingId,
          },
        },
      },
      select: {
        autogenerate: true,
        title: true,
        customPrompt: true,
        goals: true,
        length: true,
      },
    });

    await this.db.contentLecture
      .updateMany({
        where: {
          detailReadingId,
        },
        data: {
          status: false,
        },
      })
      .catch(() => {
        throw new InternalServerErrorException(
          'Error al desactivar el contenido de la lectura',
        );
      });

    if (reading.autogenerate) {
      return this.generateContentsForOneStudent(detailReadingId);
    }

    const contents = await this.ai.generateGeneralReadingService({
      title: reading.title,
      goals: reading.goals,
      length: reading.length,
      customPrompt: reading.customPrompt,
    });

    for (const element of contents) {
      await this.create({
        content: element.content,
        detailReadingId,
        type: TypeContent.TEXT,
      });
    }

    return {
      message: `Contenido agregado correctamente a la lectura`,
    };
  }
}
