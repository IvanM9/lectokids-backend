import { PrismaService } from '@/libs/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class QuestionsActivitiesService {
  constructor(private db: PrismaService) {}

  async getOneQuestionActivity(questionActivityId: string) {
    return await this.db.questionActivity
      .findUnique({
        where: {
          id: questionActivityId,
        },
        select: {
          id: true,
          question: true,
          answerActivity: {
            select: {
              id: true,
            },
          },
        },
      })
      .catch(() => {
        throw new NotFoundException('La pregunta no existe');
      });
  }

  async updateStatusQuestionActivity(questionActivityId: string) {
    const questionActivity = await this.db.questionActivity
      .findUniqueOrThrow({
        where: {
          id: questionActivityId,
        },
        select: {
          status: true,
        },
      })
      .catch(() => {
        throw new NotFoundException('La pregunta no existe');
      });

    await this.db.questionActivity
      .update({
        where: {
          id: questionActivityId,
        },
        data: {
          status: !questionActivity.status,
        },
      })
      .catch(() => {
        throw new NotFoundException('La pregunta no existe');
      });

    return { message: 'Estado de la pregunta actualizado' };
  }
}
