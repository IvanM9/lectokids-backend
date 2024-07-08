import { PrismaService } from '@/prisma.service';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { TypeActivity, TypeContent } from '@prisma/client';
import {
  AutoGenerateQuestionActivityDto,
  CreateAutoGenerateActivitiesDto,
  CreateQuestionActivityDto,
  UpdateQuestionActivityDto,
} from '../dtos/activities.dto';
import { GenerateQuestionsActivitiesDto } from '@/ai/ai.dto';
import { AiService } from '@/ai/services/ai/ai.service';
import { RoleEnum } from '@/security/jwt-strategy/role.enum';

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
          status: true,
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

  async getOneActivity(activityId: string, role: RoleEnum) {
    await this.db.activity
      .findUniqueOrThrow({
        where: {
          id: activityId,
        },
      })
      .catch(() => {
        throw new NotFoundException('La actividad no existe');
      });

    const activityData = await this.db.questionActivity.findMany({
      where: {
        activityId,
        status: true,
      },
      select: {
        id: true,
        question: true,
        answerActivity: {
          select: {
            answer: true,
            isCorrect: role === RoleEnum.TEACHER ? true : false,
            id: true,
          },
          where: {
            status: true,
          },
        },
      },
    });

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

  async generateActivityByType(
    payload: AutoGenerateQuestionActivityDto,
    generateActivityDto?: GenerateQuestionsActivitiesDto,
  ) {
    if (!generateActivityDto) {
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

      generateActivityDto = await this.getGenerateActivityDto(
        payload.detailReadingId,
        student,
      );
    }

    const questions = await this.ai.generateQuizService(
      generateActivityDto,
      payload.typeActivity,
    );

    return { message: 'Actividad generada correctamente', data: questions };
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

    for (const element of typeActivities) {
      const questions = (
        await this.generateActivityByType(
          {
            courseStudentId: payload.courseStudentId,
            detailReadingId: payload.detailReadingId,
            typeActivity: element.activityType,
          },
          generateActivityDto,
        )
      ).data;

      await this.createQuestionActivity({
        detailReadingId: payload.detailReadingId,
        questions,
        typeActivity: element.activityType,
      });
    }

    return { message: 'Actividades generadas correctamente' };
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
    await this.db.detailReading
      .findUniqueOrThrow({
        where: {
          id: data.detailReadingId,
        },
      })
      .catch(() => {
        throw new NotFoundException('La lectura no existe');
      });

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

    return { message: 'Actividad creada correctamente', data: activity.id };
  }

  async updateQuestionActivity(
    activityId: string,
    data: UpdateQuestionActivityDto,
  ) {
    const activities = await this.db.activity
      .findUniqueOrThrow({
        where: {
          id: activityId,
        },
        include: {
          questionActivities: {
            select: {
              id: true,
            },
          },
        },
      })
      .catch(() => {
        throw new NotFoundException('La actividad no existe');
      });

    for (const activity of data.questions) {
      const activityData = activities.questionActivities.find(
        (item) => item.id === activity.id,
      );

      if (activityData) {
        for (const answer of activity.answers) {
          if (answer.id) {
            await this.db.answerActivity.update({
              where: {
                id: answer.id,
              },
              data: {
                answer: answer.answer,
                isCorrect: answer.isCorrect,
              },
            });
          } else {
            await this.db.answerActivity.create({
              data: {
                answer: answer.answer,
                isCorrect: answer.isCorrect,
                questionId: activity.id,
              },
            });
          }
        }

        await this.db.questionActivity.update({
          where: {
            id: activity.id,
          },
          data: {
            question: activity.question,
          },
        });
      } else {
        await this.db.questionActivity.create({
          data: {
            question: activity.question,
            activityId,
            answerActivity: {
              create: activity.answers.map((answer) => ({
                answer: answer.answer,
                isCorrect: answer.isCorrect,
              })),
            },
          },
        });
      }
    }
    return { message: 'Actividad actualizada correctamente' };
  }

  async updateStatusQuestionActivity(activityId: string) {
    const activity = await this.db.activity
      .findUniqueOrThrow({
        where: {
          id: activityId,
        },
        select: {
          status: true,
        },
      })
      .catch(() => {
        throw new NotFoundException('La actividad no existe');
      });

    await this.db.activity
      .update({
        where: {
          id: activityId,
        },
        data: {
          status: !activity.status,
        },
      })
      .catch(() => {
        throw new BadRequestException(
          'Error al actualizar el estado de la actividad',
        );
      });

    return { message: 'Estado de la actividad actualizada correctamente' };
  }
}
