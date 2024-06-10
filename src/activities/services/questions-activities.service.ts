import { PrismaService } from '@/prisma.service';
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
}
