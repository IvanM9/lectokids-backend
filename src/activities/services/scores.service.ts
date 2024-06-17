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
} from '../dtos/activities.dto';
import { ScoreQuestionActivityInterface } from '../interfaces/score.interface';

@Injectable()
export class ScoresService {
  constructor(
    private db: PrismaService,
    private readonly logger: Logger,
  ) {}

  async getScoreByActivity(activityId: string) {
    return this.db.score.findMany({
      where: {
        activityId,
      },
    });
  }

  async scoreQuestionActivity(
    payload: CreateResponseQuestionActivityDto,
  ): Promise<{ data: ScoreQuestionActivityInterface }> {
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

    //* Verificar que las respuestas sean correctas
    if (payload.answer) {
      if (question.answerActivity.length > 0) {
        const isCorrect = question.answerActivity.some(
          (answer) => answer.answer === payload.answer,
        );
        return {
          data: {
            isCorrect,
            question: question.question,
            recommend: '',
          },
        };
      }
      // TODO: Sino, verificar que la respuesta sea correcta con IA
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
              }
            })
            .catch((err) => {
              this.logger.error(err.message, err.stack, ScoresService.name);
              throw new NotFoundException('Respuesta correcta no encontrada');
            })
        ).answer;
      } else {
        answerCorrect = answer.answer;
      }

      return {
        data: {
          isCorrect: answer.isCorrect,
          answerCorrect,
          recommend: '',
          question: question.question,
        },
      };
    } else
      throw new BadRequestException(
        'No se ha proporcionado una respuesta válida',
      );

    return {
      data: null,
    };
  }

  async saveScore(payload: CreateResponseActivityDto, userId: string) {
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
          score: (score / payload.questions.length) * 10,
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
}
