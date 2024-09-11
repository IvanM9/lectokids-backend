import { PrismaService } from '@/libs/prisma.service';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateContentDto,
  CreateContentForAllDto,
  GenerateContentReadingDto,
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
    const created = await this.db.contentLecture
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

    if (data.imageId) {
      await this.db.contentLecture.update({
        where: {
          id: created.id,
        },
        data: {
          image: {
            connect: {
              id: data.imageId,
            },
          },
        },
      });
    }

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
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return {
      data: {
        contents,
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

  async createCustomReadingForAll(payload: GenerateContentReadingDto) {
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
            numberOfImages: true,
          },
        },
      },
      where: {
        detailReading: {
          reading: {
            id: payload.readingId,
          },
        },
      },
    });

    for (const student of students) {
      await this.generateContentsForOneStudent(
        student.detailReading.id,
        student.detailReading.numberOfImages,
      );

      if (payload.autogenerateActivities) {
        await this.activitiesService.generateActivities({
          detailReadingId: student.detailReading.id,
          courseStudentId: student.courseStudent.id,
        });
      }

      if (payload.generateFrontPage)
        await this.detailReadingService.updateFrontPage(
          student.detailReading.id,
        );
    }
    return {
      message: `Contenido agregado correctamente a las lecturas`,
    };
  }

  async generateContentsForOneStudent(
    detailReadingId: string,
    numberOfImages: number = 0,
  ) {
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

    const params: GenerateReadingDto = {
      age:
        new Date().getFullYear() -
        student.courseStudent.student.user.birthDate.getFullYear(),
      title: student.detailReading.reading.title,
      goals: student.detailReading.reading.goals,
      length: student.detailReading.reading.length,
      interests: student.courseStudent.student.interests,
      city: student.courseStudent.student.city,
      problems: student.courseStudent.problems,
      preferences: student.courseStudent.customPrompt,
      genre: student.courseStudent.student.user.genre,
      grade: student.courseStudent.grade,
      customPrompt: student.detailReading.reading.customPrompt,
    };

    const contents: any[] = await this.ai.generateReadingService(params);

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
          image: { connect: { id: imageId } },
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
    const detailReading = await this.db.detailReading
      .findFirstOrThrow({
        where: {
          id: detailReadingId,
        },
        select: {
          reading: {
            select: {
              id: true,
              autogenerate: true,
              title: true,
              customPrompt: true,
              goals: true,
              length: true,
            },
          },
          numberOfImages: true,
        },
      })
      .catch(() => {
        throw new NotFoundException('No se encontró la lectura');
      });

    await this.db.detailReading
      .update({
        where: {
          id: detailReadingId,
        },
        data: {
          status: false,
        },
      })
      .catch(() => {
        throw new BadRequestException('Error al eliminar la lectura');
      });

    const studentsOnReadings = await this.db.studentsOnReadings.findMany({
      where: {
        detailReadingId,
      },
      select: {
        courseStudentId: true,
      },
    });

    const newDetailReading = await this.db.detailReading
      .create({
        data: {
          reading: {
            connect: {
              id: detailReading.reading.id,
            },
          },
          studentsOnReadings: {
            createMany: {
              data: studentsOnReadings.map((student) => ({
                courseStudentId: student.courseStudentId,
              })),
            },
          },
        },
      })
      .catch(() => {
        throw new BadRequestException('Error al crear la lectura');
      });

    if (detailReading.reading.autogenerate) {
      await this.generateContentsForOneStudent(
        newDetailReading.id,
        detailReading.numberOfImages,
      );
    } else {
      const contents = await this.ai.generateGeneralReadingService({
        title: detailReading.reading.title,
        goals: detailReading.reading.goals,
        length: detailReading.reading.length,
        customPrompt: detailReading.reading.customPrompt,
      });

      for (const element of contents) {
        await this.create({
          content: element.content,
          detailReadingId: newDetailReading.id,
          type: TypeContent.TEXT,
        });
      }
    }

    return {
      data: { newDetailReadingId: newDetailReading.id },
      message: `Contenido agregado correctamente a la lectura`,
    };
  }
}
