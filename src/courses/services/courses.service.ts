import { PrismaService } from '@/prisma.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCoursesDto } from '../dtos/courses.dto';

@Injectable()
export class CoursesService {
  constructor(private db: PrismaService) {}

  async getAllCourses(teacherId: string) {
    return await this.db.course.findMany({
      where: {
        teacher: {
          userId: teacherId,
        },
      },
      select: {
        id: true,
        name: true,
        status: true,
        description: true,
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
      .catch((error) => {
        throw new BadRequestException(error.message);
      });

    return { message: 'Curso creado correctamente' };
  }
}
