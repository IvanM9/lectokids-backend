import { PrismaService } from '@/prisma.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateStudentDto } from '../dtos/students.dto';
import { RoleEnum } from '@/security/jwt-strategy/role.enum';
import { hashSync } from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private db: PrismaService) {}

  async getAllMyStudents(teacherId: string, courseId: string) {
    return await this.db.student.findMany({
      where: {
        coursesStudent: {
          some: { course: { teacher: { userId: teacherId }, id: courseId } },
        },
      },
      select: {
        id: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            status: true,
            role: true,
          },
        },
        birthDate: true,
        city: true,
        identification: true,
        createdAt: true,
        updatedAt: true,
        interests: true,
      },
    });
  }

  async getAllTeachers() {
    return await this.db.teacher.findMany({
      select: {
        id: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            status: true,
            role: true,
          },
        },
        createdAt: true,
        updatedAt: true,
        isPending: true,
      },
    });
  }

  async createStudents(data: CreateStudentDto, teacherId: string) {
    await this.db.course
      .findFirstOrThrow({
        where: { id: data.courseId, teacher: { userId: teacherId } },
      })
      .catch(() => {
        throw new NotFoundException(
          'Este curso no existe o no pertenece al profesor',
        );
      });

    await this.db.courseStudent
      .create({
        data: {
          course: {
            connect: { id: data.courseId },
          },
          student: {
            create: {
              user: {
                create: {
                  firstName: data.firstName,
                  lastName: data.lastName,
                  role: RoleEnum.STUDENT,
                  genre: data.genre,
                  user: data.firstName + data.lastName,
                  password: hashSync(data.identification, 10),
                },
              },
              birthDate: data.birthDate,
              city: data.city,
              identification: data.identification,
              interests: data.interests,
            },
          },
          grade: data.grade,
          customPrompt: data.customPrompt,
          problems: data.problems,
        },
      })
      .catch((e) => {
        console.error(e);
        throw new BadRequestException('No se pudo crear el estudiante');
      });

    return { message: `Estudiante ${data.firstName} fue creado correctamente` };
  }
}
