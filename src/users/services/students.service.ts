import { PrismaService } from '@/prisma.service';
import { RoleEnum } from '@/security/jwt-strategy/role.enum';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hashSync } from 'bcrypt';
import { CreateStudentDto, UpdateStudentDto } from '../dtos/students.dto';

@Injectable()
export class StudentsService {
  constructor(private db: PrismaService) {}

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
                  user: data.identification,
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

  async getAllMyStudents(
    teacherId: string,
    courseId: string,
    status?: boolean,
  ) {
    return await this.db.student.findMany({
      where: {
        coursesStudent: {
          some: {
            course: { teacher: { userId: teacherId }, id: courseId },
            status,
          },
        },
      },
      select: {
        id: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            status: true,
          },
        },
        birthDate: true,
        city: true,
        identification: true,
        createdAt: true,
        updatedAt: true,
        interests: true,
        coursesStudent: {
          select: {
            grade: true,
            customPrompt: true,
            problems: true,
          },
        },
      },
    });
  }

  async updateStudent(data: UpdateStudentDto, studentId: string) {
    const courseStudentId = await this.db.courseStudent
      .findFirst({
        where: { studentId, courseId: data.courseId, status: true },
        select: { id: true },
      })
      .catch(() => {
        throw new NotFoundException('No se encontró el estudiante');
      });

    await this.db.student
      .update({
        where: { id: studentId },
        data: {
          user: {
            update: {
              firstName: data.firstName,
              lastName: data.lastName,
            },
          },
          birthDate: data.birthDate,
          city: data.city,
          interests: data.interests,
          coursesStudent: {
            update: {
              where: {
                id: courseStudentId.id,
              },
              data: {
                grade: data.grade,
                customPrompt: data.customPrompt,
                problems: data.problems,
              },
            },
          },
        },
      })
      .catch((e) => {
        console.error(e);
        throw new BadRequestException('No se pudo actualizar el estudiante');
      });

    return { message: 'Estudiante actualizado correctamente' };
  }

  async updateStudentStatus(studentId: string) {
    const user = await this.db.student.findUnique({
      where: { id: studentId },
      select: { user: { select: { status: true } } },
    });
    console.log(studentId);

    await this.db.student
      .update({
        where: { id: studentId },
        data: { user: { update: { status: !user.user.status } } },
      })
      .catch(() => {
        throw new BadRequestException('No se pudo actualizar el estudiante');
      });

    return { message: 'Estudiante actualizado correctamente' };
  }

  async deleteStudent(studentId: string) {
    await this.db.courseStudent
      .delete({ where: { id: studentId } })
      .catch(() => {
        throw new BadRequestException('No se pudo eliminar el estudiante');
      });

    return { message: 'Estudiante eliminado correctamente' };
  }
}
