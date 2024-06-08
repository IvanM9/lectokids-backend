import { PrismaService } from '@/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { TypeActivity, TypeContent } from '@prisma/client';
import {
  CreateAutoGenerateActivitiesDto,
  CreateQuestionActivityDto,
} from '../dtos/activities.dto';
import { GenerateQuestionsActivitiesDto } from '@/ai/ai.dto';
import { AiService } from '@/ai/services/ai/ai.service';

@Injectable()
export class ActivitiesService {
  constructor(
    private db: PrismaService,
    private ai: AiService,
  ) {}

  async getActivities(detailReadingId: string) {
    return {
      data: await this.db.activity.findMany({
        where: {
          detailReadingId,
        },
        select: {
          id: true,
          typeActivity: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    };
  }

  async getOneActivity(activityId: string) {
    const activity = await this.db.activity.findUnique({
      where: {
        id: activityId,
      },
    });

    let activityData;

    if (activity.typeActivity === TypeActivity.SORT_IMAGES) {
      activityData = await this.db.imageActivity.findMany({
        where: {
          activityId,
        },
        select: {
          id: true,
          order: true,
          multimedia: {
            select: {
              url: true,
              description: true,
            },
          },
        },
      });
    } else {
      activityData = await this.db.questionActivity.findMany({
        where: {
          activityId,
        },
        select: {
          id: true,
          question: true,
          answerActivity: {
            select: {
              answer: true,
              isCorrect: true,
              id: true,
            },
          },
        },
      });
    }

    return { data: activityData };
  }

  private async createActivity(
    detailReadingId: string,
    typeActivity: TypeActivity,
  ) {
    return await this.db.activity.create({
      data: {
        typeActivity,
        detailReading: {
          connect: {
            id: detailReadingId,
          },
        },
      },
    });
  }

  async generateActivities(payload: CreateAutoGenerateActivitiesDto) {
    const student = await this.db.courseStudent
      .findUniqueOrThrow({
        where: {
          id: payload.courseStudentId,
          studentsOnReadings: {
            some: {
              detailReadingId: payload.detailReadingId,
            },
          },
        },
        select: {
          student: {
            select: {
              user: {
                select: {
                  birthDate: true,
                },
              },
            },
          },
          grade: true,
        },
      })
      .catch(() => {
        throw new NotFoundException(
          'El estudiante no está inscrito en la lectura',
        );
      });

    const generateActivityDto = await this.getGenerateActivityDto(
      payload.detailReadingId,
      student,
    );

    const typeActivities =
      await this.ai.determineTypeActivities(generateActivityDto);

    const activities = [];
    for (const element of typeActivities) {
      if (element.activityType !== TypeActivity.SORT_IMAGES) {
        let isGenerated = false;

        while (!isGenerated) {
          try {
            const questions = await this.ai.generateQuizService(
              generateActivityDto,
              element.activityType,
            );

            activities.push({
              typeActivity: element.activityType,
              questions,
            });

            isGenerated = true;
          } catch (error) {
            console.log('Error generating activity', error);
          }
        }
      }
    }

    return { data: activities };
  }

  private async getGenerateActivityDto(
    detailReadingId: string,
    student: any,
  ): Promise<GenerateQuestionsActivitiesDto> {
    const detailReading = await this.db.contentLecture.findMany({
      where: {
        detailReadingId,
        type: TypeContent.TEXT,
      },
      select: {
        content: true,
      },
    });

    const content = detailReading.map((item) => item.content).join('\n');

    return {
      age:
        new Date().getFullYear() - student.student.user.birthDate.getFullYear(),
      grade: student.grade,
      reading: content,
    };
  }

  async createQuestionActivity(data: CreateQuestionActivityDto) {
    const activity = await this.createActivity(
      data.detailReadingId,
      data.typeActivity,
    );

    for (const question of data.questions) {
      const answerActivityData = question.answers?.map((answer) => ({
        answer: answer.answer,
        isCorrect: answer.isCorrect,
      }));

      await this.db.questionActivity.create({
        data: {
          question: question.question,
          activityId: activity.id,
          answerActivity: {
            create: answerActivityData,
          },
        },
      });
    }

    return { message: 'Actividad creada correctamente' };
  }
}
