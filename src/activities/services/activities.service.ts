import { PrismaService } from '@/prisma.service';
import { Injectable } from '@nestjs/common';
import { TypeActivity } from '@prisma/client';
import { CreateQuestionActivityDto } from '../dtos/activities.dto';

@Injectable()
export class ActivitiesService {
  constructor(private db: PrismaService) {}

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
