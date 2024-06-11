import { PrismaService } from '@/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class AnswersActivitiesService {
  constructor(private db: PrismaService) {}

  async getAnswersActivities(questionActivityId: string) {
    return {
      data: await this.db.answerActivity.findMany({
        where: {
          questionId: questionActivityId,
        },
        select: {
          id: true,
          answer: true,
          isCorrect: true,
        },
      }),
    };
  }

  async getOneAnswerActivity(answerActivityId: string) {
    return await this.db.answerActivity
      .findUniqueOrThrow({
        where: {
          id: answerActivityId,
        },
      })
      .catch(() => {
        throw new NotFoundException('La respuesta no existe');
      });
  }

  async updateStatusAnswerActivity(answerActivityId: string) {
    const answerActivity = await this.db.answerActivity
      .findUniqueOrThrow({
        where: {
          id: answerActivityId,
        },
        select: {
          status: true,
        },
      })
      .catch(() => {
        throw new NotFoundException('La respuesta no existe');
      });

    await this.db.answerActivity
      .update({
        where: {
          id: answerActivityId,
        },
        data: {
          status: !answerActivity.status,
        },
      })
      .catch(() => {
        throw new NotFoundException('La respuesta no existe');
      });

    return { message: 'Estado de la respuesta actualizada correctamente' };
  }
}
