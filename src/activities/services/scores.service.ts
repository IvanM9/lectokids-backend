import { PrismaService } from '@/libs/prisma.service';
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
import { renderFile } from 'ejs';
import { ENVIRONMENT } from '@/shared/constants/environment';
import puppeteer from 'puppeteer';

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
        status: true,
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
          answer: payload.answer,
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
          answer: payload.answer,
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
        answer: answer.answer,
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
            set: qualifiedActivities.map((item) => ({
              question: item.question,
              isCorrect: item.isCorrect,
              recommend: item.recommend,
              answer: item.answer,
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

  async getScoreByDetailReading(detailReadingId: string, userId: string) {
    const courseStudent = await this.db.courseStudent
      .findFirstOrThrow({
        where: {
          student: {
            userId,
          },
          studentsOnReadings: {
            some: {
              detailReading: {
                id: detailReadingId,
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

    const activities = await this.db.activity.findMany({
      where: {
        detailReadingId,
        status: true,
      },
      select: {
        id: true,
        typeActivity: true,
      },
    });

    const scores = [];
    for (const activity of activities) {
      const count = await this.db.score.count({
        where: {
          activityId: activity.id,
          courseStudentId: courseStudent.id,
        },
      });

      const allScores = await this.db.score.findMany({
        where: {
          activityId: activity.id,
          courseStudentId: courseStudent.id,
        },
        select: {
          score: true,
          createdAt: true,
          reponses: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      scores.push({
        activityId: activity.id,
        score: Number(allScores[allScores.length - 1]?.score ?? 0).toFixed(2),
        allScores: allScores.map((item) => ({
          score: Number(item.score).toFixed(2),
          createdAt: item.createdAt,
          responses: item.reponses,
        })),
        typeActivity: activity.typeActivity,
        count,
      });
    }

    return {
      data: scores,
    };
  }

  async getScoreByReading(readingId: string) {
    const studentsOnReadings = await this.db.studentsOnReadings.findMany({
      where: {
        detailReading: {
          readingId,
          status: true,
        },
      },
      select: {
        courseStudent: {
          select: {
            student: {
              select: {
                id: true,
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        detailReadingId: true,
      },
      orderBy: {
        detailReading: {
          createdAt: 'asc',
        },
      },
    });

    const scores: {
      studentId: string;
      studentName: string;
      scores: any[];
      detailReadingId: string;
    }[] = [];

    for (const student of studentsOnReadings) {
      const scoreByStudent = await this.getScoreByDetailReading(
        student.detailReadingId,
        student.courseStudent.student.user.id,
      );

      scores.push({
        studentId: student.courseStudent.student.id,
        studentName: `${student.courseStudent.student.user.firstName} ${student.courseStudent.student.user.lastName}`,
        scores: scoreByStudent.data,
        detailReadingId: student.detailReadingId,
      });
    }

    return {
      data: scores,
    };
  }

  async getScoreByCourses(userId: string) {
    const courses = await this.db.courseStudent.findMany({
      where: {
        student: {
          userId,
        },
        course: {
          status: true,
        },
        status: true,
      },
      select: {
        course: {
          select: {
            id: true,
            name: true,
            levels: {
              select: {
                id: true,
                readings: {
                  select: {
                    id: true,
                    title: true,
                    detailReadings: {
                      where: {
                        status: true,
                        studentsOnReadings: {
                          some: {
                            courseStudent: {
                              student: {
                                userId,
                              },
                            },
                          },
                        },
                      },
                      select: {
                        id: true,
                      },
                    },
                  },
                  where: {
                    status: true,
                  },
                  orderBy: {
                    createdAt: 'asc',
                  },
                },
              },
              where: {
                status: true,
              },
            },
            status: true,
          },
        },
      },
    });

    const scores = [];
    for (const course of courses) {
      const readings = [];
      for (const level of course.course.levels) {
        for (const reading of level.readings) {
          if (reading.detailReadings.length === 0) continue;

          const score = await this.getScoreByDetailReading(
            reading.detailReadings[0].id,
            userId,
          );
          readings.push({
            readingId: reading.id,
            readingTitle: reading.title,
            scores: score.data,
          });
        }
      }
      scores.push({
        courseId: course.course.id,
        courseName: course.course.name,
        readings,
      });
    }

    return {
      data: scores,
    };
  }

  async getAllScoreByCourse(userId: string, courseId: string) {
    const course = await this.db.course
      .findUniqueOrThrow({
        where: {
          id: courseId,
          teacher: {
            userId,
          },
        },
        select: {
          id: true,
          name: true,
          levels: {
            select: {
              id: true,
              readings: {
                select: {
                  id: true,
                  title: true,
                  detailReadings: {
                    where: {
                      status: true,
                    },
                    select: {
                      id: true,
                    },
                  },
                },
                where: {
                  status: true,
                },
                orderBy: {
                  createdAt: 'asc',
                },
              },
              name: true,
            },
            where: {
              status: true,
              readings: {
                some: {
                  detailReadings: {
                    some: {
                      status: true,
                    },
                  },
                },
              },
            },
          },
        },
      })
      .catch(() => {
        throw new NotFoundException('Curso no encontrado');
      });

    const levels = [];
    for (const levelItem of course.levels) {
      const readings = [];
      for (const reading of levelItem.readings) {
        const score = (await this.getScoreByReading(reading.id)).data;

        const scores = [];

        for (const item of score) {
          const readingTimeSpends = await this.db.timeSpend.findMany({
            where: {
              detailReadingId: item.detailReadingId,
              courseStudent: {
                studentId: item.studentId,
              },
            },
            select: {
              startTime: true,
              endTime: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          });

          scores.push({
            studentId: item.studentId,
            studentName: item.studentName,
            scores: item.scores,
            detailReadingId: item.detailReadingId,
            readingTimeSpends: readingTimeSpends.map((time) => {
              const timeSpendAux =
                (time.endTime.getTime() - time.startTime.getTime()) / 1000;

              return {
                createdAt: time.createdAt,
                timeSpend:
                  timeSpendAux > 60
                    ? (timeSpendAux / 60).toFixed(2) + ' minutos'
                    : timeSpendAux.toFixed(0) + ' segundos',
              };
            }),
          });
        }

        readings.push({
          readingId: reading.id,
          readingTitle: reading.title,
          scores,
        });
      }

      levels.push({
        levelId: levelItem.id,
        levelName: levelItem.name,
        readings,
      });
    }

    return {
      data: levels,
    };
  }

  async getPDFScoreByCourse(userId: string, courseId: string) {
    const data = (await this.getAllScoreByCourse(userId, courseId)).data;

    return new Promise<Buffer>((resolve, reject) => {
      renderFile(
        ENVIRONMENT.VIEWS_DIR + '/report-by-course.ejs',
        { course: data },
        async (err, html) => {
          if (err) {
            reject(err);
            return;
          }

          const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
          });

          const page = await browser.newPage();
          await page.setContent(html);

          const buffer = await page.pdf({
            format: 'A4',
            margin: {
              top: '20px',
              bottom: '20px',
              left: '20px',
              right: '20px',
            },
          });

          await browser.close();

          resolve(buffer);
        },
      );
    });
  }

  async getScoreByStudent(userId: string, studentId: string, courseId: string) {
    const course = await this.db.course
      .findUniqueOrThrow({
        where: {
          id: courseId,
          teacher: {
            userId,
          },
        },
        select: {
          id: true,
          name: true,
          levels: {
            select: {
              id: true,
              readings: {
                select: {
                  id: true,
                  title: true,
                  detailReadings: {
                    where: {
                      status: true,
                    },
                    select: {
                      id: true,
                    },
                  },
                },
                where: {
                  status: true,
                },
              },
              name: true,
            },
            where: {
              status: true,
              readings: {
                some: {
                  detailReadings: {
                    some: {
                      status: true,
                    },
                  },
                },
              },
            },
          },
        },
      })
      .catch(() => {
        throw new NotFoundException('Curso no encontrado');
      });

    const levels = [];
    for (const levelItem of course.levels) {
      const readings = [];
      for (const reading of levelItem.readings) {
        const score = (await this.getScoreByReading(reading.id)).data;

        const scores = [];

        for (const item of score) {
          if (item.studentId !== studentId) continue;

          const readingTimeSpends = await this.db.timeSpend.findMany({
            where: {
              detailReadingId: item.detailReadingId,
              courseStudent: {
                studentId: item.studentId,
              },
            },
            select: {
              startTime: true,
              endTime: true,
              createdAt: true,
            },
          });

          scores.push({
            studentId: item.studentId,
            studentName: item.studentName,
            scores: item.scores,
            detailReadingId: item.detailReadingId,
            readingTimeSpends: readingTimeSpends.map((time) => ({
              createdAt: time.createdAt,
              timeSpend:
                (
                  (time.endTime.getTime() - time.startTime.getTime()) /
                  1000 /
                  60
                ).toFixed(2) + ' minutos',
            })),
          });
        }

        readings.push({
          readingId: reading.id,
          readingTitle: reading.title,
          scores,
        });
      }

      levels.push({
        levelId: levelItem.id,
        levelName: levelItem.name,
        readings,
      });
    }

    return {
      data: levels,
    };
  }

  async getPDFScoreByStudent(
    userId: string,
    studentId: string,
    courseId: string,
  ) {
    const data = (await this.getScoreByStudent(userId, studentId, courseId))
      .data;

    return new Promise<Buffer>((resolve, reject) => {
      renderFile(
        ENVIRONMENT.VIEWS_DIR + '/report-by-student.ejs',
        { data },
        async (err, html) => {
          if (err) {
            reject(err);
            return;
          }

          const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
          });

          const page = await browser.newPage();
          await page.setContent(html);

          const buffer = await page.pdf({ format: 'A4' });

          await browser.close();

          resolve(buffer);
        },
      );
    });
  }
}
