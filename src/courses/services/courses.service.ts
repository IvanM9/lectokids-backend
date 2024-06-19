import { PrismaService } from '@/prisma.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCoursesDto } from '../dtos/courses.dto';

@Injectable()
export class CoursesService {
  constructor(private db: PrismaService) {}

  async getAllCourses(teacherId: string, status?: boolean) {
    return await this.db.course.findMany({
      where: {
        teacher: {
          userId: teacherId,
        },
        status,
      },
      select: {
        id: true,
        name: true,
        status: true,
        description: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async createCourse(userId: string, data: CreateCoursesDto) {
    const { id } = await this.db.teacher
      .findFirstOrThrow({
        where: {
          userId,
        },
        select: {
          id: true,
        },
      })
      .catch(() => {
        throw new BadRequestException('El usuario no es un profesor');
      });

    await this.db.course
      .create({
        data: {
          ...data,
          teacher: {
            connect: {
              id,
            },
          },
        },
      })
      .catch(() => {
        throw new BadRequestException('No se pudo crear el curso');
      });

    return { message: 'Curso creado correctamente' };
  }

  async updateCourse(userId: string, courseId: string, data: CreateCoursesDto) {
    await this.db.teacher
      .findFirstOrThrow({
        where: {
          userId,
        },
        select: {
          id: true,
        },
      })
      .catch(() => {
        throw new BadRequestException('El usuario no es un profesor');
      });

    await this.db.course
      .update({
        where: {
          id: courseId,
        },
        data,
      })
      .catch(() => {
        throw new BadRequestException('No se pudo actualizar el curso');
      });

    return { message: 'Curso actualizado correctamente' };
  }

  async updateStatusCourse(userId: string, courseId: string) {
    const { id } = await this.db.teacher
      .findFirstOrThrow({
        where: {
          userId,
        },
        select: {
          id: true,
        },
      })
      .catch(() => {
        throw new BadRequestException('El usuario no es un profesor');
      });

    const course = await this.db.course
      .findFirstOrThrow({
        where: {
          id: courseId,
          teacherId: id,
        },
        select: {
          status: true,
        },
      })
      .catch(() => {
        throw new BadRequestException('No se pudo encontrar el curso');
      });

    await this.db.course
      .update({
        where: {
          id: courseId,
        },
        data: {
          status: !course.status,
        },
      })
      .catch(() => {
        throw new BadRequestException('No se pudo actualizar el curso');
      });

    return { message: 'Curso actualizado correctamente' };
  }

  async getAllCoursesStudent(studentId: string) {
    return await this.db.course.findMany({
      where: {
        courseStudents: {
          some: {
            student: {
              user: {
                id: studentId,
              },
            },
            status: true,
          },
        },
      },
      select: {
        name: true,
        id: true,
        description: true,
        levels: {
          select: {
            id: true,
            readings: {
              select: {
                id: true,
                title: true,
                detailReadings: {
                  select: {
                    id: true,
                  },
                  where: {
                    studentsOnReadings: {
                      some: {
                        courseStudent:{
                          student: {
                            user: {
                              id: studentId
                            }
                        }
                      }
                    }
                  }
                  }
                }
              }
            }
          }
        }
      },
    });
  }
}
