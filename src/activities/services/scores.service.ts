import { PrismaService } from '@/prisma.service';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateResponseActivityDto,
  CreateResponseQuestionActivityDto,
  CreateSaveScoreDto,
} from '../dtos/activities.dto';
import { ScoreQuestionActivityInterface } from '../interfaces/score.interface';
import { AiService } from '@/ai/services/ai/ai.service';
import { TypeContent } from '@prisma/client';

@Injectable()
export class ScoresService {
  constructor(
    private db: PrismaService,
    private readonly logger: Logger,
    private readonly ai: AiService,
  ) {}

  async getScoreByActivity(activityId: string) {
    return {
      data: await this.db.score.findMany({
        where: {
          activityId,
        },
      }),
    };
  }

  async scoreQuestionActivity(
    payload: CreateResponseQuestionActivityDto,
  ): Promise<{ data: ScoreQuestionActivityInterface }> {
    const response: { data: ScoreQuestionActivityInterface } = { data: null };

    const question = await this.db.questionActivity
      .findFirstOrThrow({
        where: {
          id: payload.questionActivityId,
        },
        select: {
          answerActivity: true,
          question: true,
        },
      })
      .catch((err) => {
        this.logger.error(err.message, err.stack, ScoresService.name);
        throw new NotFoundException('Actividad no encontrada');
      });

    const contentsReading = await this.db.contentLecture.findMany({
      where: {
        detailReading: {
          activities: {
            some: {
              questionActivities: {
                some: {
                  id: payload.questionActivityId,
                },
              },
            },
          },
        },
        type: TypeContent.TEXT,
      },
      select: {
        content: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const readingText = contentsReading.map((item) => item.content).join('\n');

    //* Verificar que las respuestas sean correctas
    if (payload.answer) {
      if (question.answerActivity.length > 0) {
        const isCorrect = question.answerActivity.some(
          (answer) => answer.answer === payload.answer,
        );

        response.data = {
          isCorrect,
          question: question.question,
          recommend:
            await this.ai.generateRecommendationForQuestionsActivitiesService({
              question: question.question,
              answer: payload.answer,
              reading: readingText,
            }),
        };
      } else {
        response.data = {
          isCorrect: await this.ai.generateVerificationOpenTextOrAnswerService({
            question: question.question,
            answer: payload.answer,
            reading: readingText,
          }),
          question: question.question,
          recommend:
            await this.ai.generateRecommendationForQuestionsActivitiesService({
              question: question.question,
              answer: payload.answer,
              reading: readingText,
            }),
        };
      }
    } else if (payload.answerActivityId) {
      const answer = await this.db.answerActivity
        .findFirstOrThrow({
          where: {
            id: payload.answerActivityId,
          },
          select: {
            isCorrect: true,
            answer: true,
          },
        })
        .catch((err) => {
          this.logger.error(err.message, err.stack, ScoresService.name);
          throw new NotFoundException('Respuesta no encontrada');
        });

      let answerCorrect = null;
      if (!answer.isCorrect) {
        answerCorrect = (
          await this.db.answerActivity
            .findFirst({
              where: {
                questionId: payload.questionActivityId,
                isCorrect: true,
              },
              select: {
                answer: true,
              },
            })
            .catch((err) => {
              this.logger.error(err.message, err.stack, ScoresService.name);
              throw new NotFoundException('Respuesta correcta no encontrada');
            })
        ).answer;
      } else {
        answerCorrect = answer.answer;
      }

      response.data = {
        isCorrect: answer.isCorrect,
        question: question.question,
        recommend:
          await this.ai.generateRecommendationForQuestionsActivitiesService({
            question: question.question,
            answer: answer.answer,
            reading: readingText,
          }),
        answerCorrect,
      };
    } else
      throw new BadRequestException(
        'No se ha proporcionado una respuesta válida',
      );

    return response;
  }

  async saveQuestionScore(payload: CreateResponseActivityDto, userId: string) {
    const courseStudent = await this.db.courseStudent
      .findFirstOrThrow({
        where: {
          student: {
            userId,
          },
          studentsOnReadings: {
            some: {
              detailReading: {
                activities: {
                  some: {
                    id: payload.activityId,
                  },
                },
              },
            },
          },
        },
        select: {
          id: true,
        },
      })
      .catch((err) => {
        this.logger.error(err.message, err.stack, ScoresService.name);
        throw new NotFoundException('Estudiante no encontrado');
      });

    let score = 0;
    const qualifiedActivities = [];
    for (const response of payload.questions) {
      const qualified = await this.scoreQuestionActivity(response);
      if (qualified.data.isCorrect) score++;

      qualifiedActivities.push(qualified.data);
    }

    const data = await this.db.score
      .create({
        data: {
          score: Number((score / payload.questions.length) * 10).toFixed(2),
          activity: {
            connect: {
              id: payload.activityId,
            },
          },
          courseStudent: {
            connect: {
              id: courseStudent.id,
            },
          },
          reponses: {
            set: payload.questions.map((question) => ({
              questionActivityId: question.questionActivityId,
              answerActivityId: question.answerActivityId,
              answer: question.answer,
            })),
          },
        },
      })
      .catch((err) => {
        this.logger.error(err.message, err.stack, ScoresService.name);
        throw new BadRequestException('No se pudo guardar la calificación');
      });

    return {
      message: 'Calificación guardada',
      data: { score: data.score, qualifiedActivities },
    };
  }

  async saveScore(payload: CreateSaveScoreDto, userId: string) {
    const courseStudent = await this.db.courseStudent
      .findFirstOrThrow({
        where: {
          student: {
            userId,
          },
          studentsOnReadings: {
            some: {
              detailReading: {
                activities: {
                  some: {
                    id: payload.activityId,
                  },
                },
              },
            },
          },
        },
        select: {
          id: true,
        },
      })
      .catch((err) => {
        this.logger.error(err.message, err.stack, ScoresService.name);
        throw new NotFoundException('Estudiante no encontrado');
      });

    await this.db.score
      .create({
        data: {
          score: payload.score,
          activity: {
            connect: {
              id: payload.activityId,
            },
          },
          courseStudent: {
            connect: {
              id: courseStudent.id,
            },
          },
        },
      })
      .catch((err) => {
        this.logger.error(err.message, err.stack, ScoresService.name);
        throw new BadRequestException('No se pudo guardar la calificación');
      });

    return {
      message: 'Calificación guardada',
    };
  }
}
