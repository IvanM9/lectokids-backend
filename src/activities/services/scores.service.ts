import { PrismaService } from '@/libs/prisma.service';
import {
  BadRequestException,
  Inject,
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
import { PuppeteerPoolService } from '@/shared/services/puppeteer-pool.service';
import serverConfig from '@/shared/config/server.config';
import { ConfigType } from '@nestjs/config';

@Injectable()
export class ScoresService {
  constructor(
    private db: PrismaService,
    private readonly logger: Logger,
    private readonly ai: AiService,
    private readonly puppeteerPool: PuppeteerPoolService,
    @Inject(serverConfig.KEY)
    private environment: ConfigType<typeof serverConfig>,
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
        const calification =
          await this.ai.generateVerificationOpenTextOrAnswerService({
            question: question.question,
            answer: payload.answer,
            reading: readingText,
          });

        response.data = {
          isCorrect: calification.isCorrect == 'true',
          question: question.question,
          recommend: calification.recommendation,
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
        scores: {
          where: {
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
        },
      },
    });

    const scores = activities.map((activity) => ({
      activityId: activity.id,
      score: Number(
        activity.scores[activity.scores.length - 1]?.score ?? 0,
      ).toFixed(2),
      allScores: activity.scores.map((item) => ({
        score: Number(item.score).toFixed(2),
        createdAt: item.createdAt,
        responses: item.reponses,
      })),
      typeActivity: activity.typeActivity,
      count: activity.scores.length,
    }));

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
            id: true,
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
        detailReading: {
          select: {
            activities: {
              where: {
                status: true,
              },
              select: {
                id: true,
                typeActivity: true,
                scores: {
                  select: {
                    courseStudentId: true,
                    score: true,
                    createdAt: true,
                    reponses: true,
                  },
                  orderBy: {
                    createdAt: 'asc',
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        detailReading: {
          createdAt: 'asc',
        },
      },
    });

    const scores = studentsOnReadings.map((student) => {
      const activities = student.detailReading.activities;
      const studentScores = activities.map((activity) => {
        const activityScores = activity.scores.filter(
          (score) => score.courseStudentId === student.courseStudent.id,
        );

        return {
          activityId: activity.id,
          score: Number(
            activityScores[activityScores.length - 1]?.score ?? 0,
          ).toFixed(2),
          allScores: activityScores.map((item) => ({
            score: Number(item.score).toFixed(2),
            createdAt: item.createdAt,
            responses: item.reponses,
          })),
          typeActivity: activity.typeActivity,
          count: activityScores.length,
        };
      });

      return {
        studentId: student.courseStudent.student.id,
        studentName: `${student.courseStudent.student.user.firstName} ${student.courseStudent.student.user.lastName}`,
        scores: studentScores,
        detailReadingId: student.detailReadingId,
      };
    });

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
        id: true,
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
                        activities: {
                          where: {
                            status: true,
                          },
                          select: {
                            id: true,
                            typeActivity: true,
                            scores: {
                              where: {
                                courseStudent: {
                                  student: {
                                    userId,
                                  },
                                },
                              },
                              select: {
                                score: true,
                                createdAt: true,
                                reponses: true,
                              },
                              orderBy: {
                                createdAt: 'asc',
                              },
                            },
                          },
                        },
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

    const scores = courses.map((course) => {
      const readings = course.course.levels.flatMap((level) =>
        level.readings
          .filter((reading) => reading.detailReadings.length > 0)
          .map((reading) => {
            const detailReading = reading.detailReadings[0];
            const activityScores = detailReading.activities.map((activity) => ({
              activityId: activity.id,
              score: Number(
                activity.scores[activity.scores.length - 1]?.score ?? 0,
              ).toFixed(2),
              allScores: activity.scores.map((item) => ({
                score: Number(item.score).toFixed(2),
                createdAt: item.createdAt,
                responses: item.reponses,
              })),
              typeActivity: activity.typeActivity,
              count: activity.scores.length,
            }));

            return {
              readingId: reading.id,
              readingTitle: reading.title,
              scores: activityScores,
            };
          }),
      );

      return {
        courseId: course.course.id,
        courseName: course.course.name,
        readings,
      };
    });

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
              name: true,
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
                      studentsOnReadings: {
                        select: {
                          courseStudent: {
                            select: {
                              id: true,
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
                        },
                      },
                      activities: {
                        where: {
                          status: true,
                        },
                        select: {
                          id: true,
                          typeActivity: true,
                          scores: {
                            select: {
                              courseStudentId: true,
                              score: true,
                              createdAt: true,
                              reponses: true,
                              courseStudent: {
                                select: {
                                  studentId: true,
                                },
                              },
                            },
                            orderBy: {
                              createdAt: 'asc',
                            },
                          },
                        },
                      },
                      timeSpends: {
                        select: {
                          courseStudentId: true,
                          startTime: true,
                          endTime: true,
                          createdAt: true,
                          courseStudent: {
                            select: {
                              studentId: true,
                            },
                          },
                        },
                        orderBy: {
                          createdAt: 'desc',
                        },
                      },
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

    const levels = course.levels.map((levelItem) => {
      const readings = levelItem.readings.map((reading) => {
        const scores = reading.detailReadings.flatMap((detailReading) => {
          return detailReading.studentsOnReadings.map((studentOnReading) => {
            const student = studentOnReading.courseStudent.student;
            const studentId = student.id;

            const studentScores = detailReading.activities.map((activity) => {
              const activityScores = activity.scores.filter(
                (score) => score.courseStudent.studentId === studentId,
              );

              return {
                activityId: activity.id,
                score: Number(
                  activityScores[activityScores.length - 1]?.score ?? 0,
                ).toFixed(2),
                allScores: activityScores.map((item) => ({
                  score: Number(item.score).toFixed(2),
                  createdAt: item.createdAt,
                  responses: item.reponses,
                })),
                typeActivity: activity.typeActivity,
                count: activityScores.length,
              };
            });

            const readingTimeSpends = detailReading.timeSpends
              .filter(
                (timeSpend) => timeSpend.courseStudent.studentId === studentId,
              )
              .map((time) => {
                const timeSpendAux =
                  (time.endTime.getTime() - time.startTime.getTime()) / 1000;

                return {
                  createdAt: time.createdAt,
                  timeSpend:
                    timeSpendAux > 60
                      ? (timeSpendAux / 60).toFixed(2) + ' minutos'
                      : timeSpendAux.toFixed(0) + ' segundos',
                };
              });

            return {
              studentId,
              studentName: `${student.user.firstName} ${student.user.lastName}`,
              scores: studentScores,
              detailReadingId: detailReading.id,
              readingTimeSpends,
            };
          });
        });

        return {
          readingId: reading.id,
          readingTitle: reading.title,
          scores,
        };
      });

      return {
        levelId: levelItem.id,
        levelName: levelItem.name,
        readings,
      };
    });

    return {
      data: levels,
    };
  }

  async getPDFScoreByCourse(userId: string, courseId: string): Promise<Buffer> {
    try {
      const data = (await this.getAllScoreByCourse(userId, courseId)).data;

      const html = await new Promise<string>((resolve, reject) => {
        renderFile(
          this.environment.viewsDir + '/report-by-course.ejs',
          { course: data },
          (err, html) => {
            if (err) {
              this.logger.error('Error rendering course report template', err);
              reject(new BadRequestException('Error generando el reporte'));
              return;
            }
            resolve(html);
          },
        );
      });

      return await this.puppeteerPool.generatePDF(html, {
        format: 'A4',
        margin: {
          top: '20px',
          bottom: '20px',
          left: '20px',
          right: '20px',
        },
      });
    } catch (error) {
      this.logger.error('Error generating course PDF report', error);
      throw new BadRequestException('Error generando el reporte PDF');
    }
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
              name: true,
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
                            studentId,
                          },
                        },
                      },
                    },
                    select: {
                      id: true,
                      studentsOnReadings: {
                        where: {
                          courseStudent: {
                            studentId,
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
                                      firstName: true,
                                      lastName: true,
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                      activities: {
                        where: {
                          status: true,
                        },
                        select: {
                          id: true,
                          typeActivity: true,
                          scores: {
                            where: {
                              courseStudent: {
                                studentId,
                              },
                            },
                            select: {
                              score: true,
                              createdAt: true,
                              reponses: true,
                            },
                            orderBy: {
                              createdAt: 'asc',
                            },
                          },
                        },
                      },
                      timeSpends: {
                        where: {
                          courseStudent: {
                            studentId,
                          },
                        },
                        select: {
                          startTime: true,
                          endTime: true,
                          createdAt: true,
                        },
                      },
                    },
                  },
                },
                where: {
                  status: true,
                },
              },
            },
            where: {
              status: true,
              readings: {
                some: {
                  detailReadings: {
                    some: {
                      status: true,
                      studentsOnReadings: {
                        some: {
                          courseStudent: {
                            studentId,
                          },
                        },
                      },
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

    const levels = course.levels.map((levelItem) => {
      const readings = levelItem.readings
        .filter((reading) => reading.detailReadings.length > 0)
        .map((reading) => {
          const scores = reading.detailReadings.map((detailReading) => {
            const student =
              detailReading.studentsOnReadings[0]?.courseStudent.student;

            const studentScores = detailReading.activities.map((activity) => ({
              activityId: activity.id,
              score: Number(
                activity.scores[activity.scores.length - 1]?.score ?? 0,
              ).toFixed(2),
              allScores: activity.scores.map((item) => ({
                score: Number(item.score).toFixed(2),
                createdAt: item.createdAt,
                responses: item.reponses,
              })),
              typeActivity: activity.typeActivity,
              count: activity.scores.length,
            }));

            const readingTimeSpends = detailReading.timeSpends.map((time) => ({
              createdAt: time.createdAt,
              timeSpend:
                (
                  (time.endTime.getTime() - time.startTime.getTime()) /
                  1000 /
                  60
                ).toFixed(2) + ' minutos',
            }));

            return {
              studentId: student?.id || studentId,
              studentName: student
                ? `${student.user.firstName} ${student.user.lastName}`
                : '',
              scores: studentScores,
              detailReadingId: detailReading.id,
              readingTimeSpends,
            };
          });

          return {
            readingId: reading.id,
            readingTitle: reading.title,
            scores,
          };
        });

      return {
        levelId: levelItem.id,
        levelName: levelItem.name,
        readings,
      };
    });

    return {
      data: levels,
    };
  }

  async getPDFScoreByStudent(
    userId: string,
    studentId: string,
    courseId: string,
  ): Promise<Buffer> {
    try {
      const data = (await this.getScoreByStudent(userId, studentId, courseId))
        .data;

      const html = await new Promise<string>((resolve, reject) => {
        renderFile(
          this.environment.viewsDir + '/report-by-student.ejs',
          { data },
          (err, html) => {
            if (err) {
              this.logger.error('Error rendering student report template', err);
              reject(new BadRequestException('Error generando el reporte'));
              return;
            }
            resolve(html);
          },
        );
      });

      return await this.puppeteerPool.generatePDF(html, {
        format: 'A4',
      });
    } catch (error) {
      this.logger.error('Error generating student PDF report', error);
      throw new BadRequestException('Error generando el reporte PDF');
    }
  }
}
