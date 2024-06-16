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

  async scoreQuestionActivity(payload: CreateResponseQuestionActivityDto) {
    const question = await this.db.questionActivity
      .findFirstOrThrow({
        where: {
          id: payload.questionActivityId,
        },
        select: {
          answerActivity: true,
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
        return { data: isCorrect };
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

      return { data: answer.isCorrect };
    } else
      throw new BadRequestException(
        'No se ha proporcionado una respuesta válida',
      );

    return { data: false };
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
    for (const response of payload.questions) {
      const isCorrect = await this.scoreQuestionActivity(response);
      if (isCorrect.data) score++;
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

    return { message: 'Calificación guardada', data: data.score };
  }
}
