import { PrismaService } from '@/libs/prisma.service';
import { RoleEnum } from '@/security/jwt-strategy/role.enum';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { hashSync } from 'bcrypt';
import { CreateStudentDto, UpdateStudentDto } from '../dtos/students.dto';
import * as XLSX from 'xlsx';

@Injectable()
export class StudentsService {
  constructor(
    private db: PrismaService,
    private logger: Logger,
  ) {}

  async createStudents(data: CreateStudentDto, teacherId: string) {
    await this.db.course
      .findFirstOrThrow({
        where: { id: data.courseId, teacher: { userId: teacherId } },
      })
      .catch((err) => {
        this.logger.error(err.message, err.stack, StudentsService.name);
        throw new NotFoundException(
          'Este curso no existe o no pertenece al profesor',
        );
      });

    let student = await this.db.student.findFirst({
      where: { user: { identification: data.identification } },
    });

    if (!student) {
      student = await this.db.student
        .create({
          data: {
            user: {
              create: {
                firstName: data.firstName,
                lastName: data.lastName,
                identification: data.identification,
                genre: data.genre,
                birthDate: data.birthDate,
                password: hashSync(data.identification, 10),
                role: RoleEnum.STUDENT,
                user: data.identification,
              },
            },
            interests: data.interests,
            city: data.city,
            haveDyslexia: data.haveDyslexia,
          },
        })
        .catch((e) => {
          this.logger.error(e.message, e.stack, StudentsService.name);
          throw new BadRequestException('No se pudo crear el estudiante');
        });
    }

    await this.db.courseStudent
      .create({
        data: {
          course: {
            connect: { id: data.courseId },
          },
          student: {
            connect: { id: student.id },
          },
          grade: data.grade,
          customPrompt: data.customPrompt,
          problems: data.problems,
        },
      })
      .catch((e) => {
        this.logger.error(e.message, e.stack, StudentsService.name);
        throw new BadRequestException('No se pudo crear el estudiante');
      });

    return { message: `Estudiante ${data.firstName} fue creado correctamente` };
  }

  async getAllMyStudents(
    teacherId: string,
    courseId: string,
    search: string = '',
    status?: boolean,
    page?: number,
  ) {
    const data = await this.db.student.findMany({
      where: {
        coursesStudent: {
          some: {
            course: { teacher: { userId: teacherId }, id: courseId },
            status,
          },
        },
        user: {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
          ],
        },
      },
      select: {
        id: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            status: true,
            birthDate: true,
            identification: true,
            genre: true,
          },
        },
        city: true,
        createdAt: true,
        updatedAt: true,
        interests: true,
        haveDyslexia: true,
        coursesStudent: {
          select: {
            grade: true,
            customPrompt: true,
            problems: true,
          },
          where: {
            courseId,
          },
        },
      },
      skip: page ? (page - 1) * 10 : 0,
      take: 10,
      orderBy: {
        user: {
          firstName: 'asc',
        },
      },
    });

    const total = await this.db.student.count({
      where: {
        coursesStudent: {
          some: {
            course: { teacher: { userId: teacherId }, id: courseId },
            status,
          },
        },
        user: {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
          ],
        },
      },
    });

    return { data: { students: data, total } };
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
              birthDate: data.birthDate,
            },
          },
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
          haveDyslexia: data.haveDyslexia,
        },
      })
      .catch((e) => {
        console.error(e);
        throw new BadRequestException('No se pudo actualizar el estudiante');
      });

    return { message: 'Estudiante actualizado correctamente' };
  }

  async updateStudentStatus(studentId: string, courseId: string) {
    const data = await this.db.courseStudent
      .findFirstOrThrow({
        where: { studentId, courseId },
        select: { id: true, status: true },
      })
      .catch(() => {
        throw new NotFoundException('No se encontró el estudiante');
      });

    await this.db.courseStudent
      .update({
        where: { id: data.id },
        data: { status: !data.status },
      })
      .catch(() => {
        throw new BadRequestException('No se pudo actualizar el estudiante');
      });

    return { message: 'Estudiante actualizado correctamente' };
  }

  async getStudentByIdentification(identification: string) {
    return await this.db.student.findFirst({
      where: { user: { identification } },
      select: {
        id: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            status: true,
            genre: true,
            birthDate: true,
          },
        },
        city: true,
        interests: true,
        haveDyslexia: true,
      },
    });
  }

  async myProfile(userId: string) {
    return await this.db.student.findFirst({
      where: { userId },
      select: {
        id: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            identification: true,
            genre: true,
            birthDate: true,
          },
        },
        city: true,
        interests: true,
        haveDyslexia: true,
      },
    });
  }

  async importFromExcel(
    file: Express.Multer.File,
    userId: string,
    courseId: string,
  ) {
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // Validar que el archivo tenga la estructura correcta
    const keys = Object.keys(jsonData[0]);
    const validKeys = [
      'Nombres',
      'Apellidos',
      'Identificación',
      'Género',
      'Fecha de nacimiento',
      'Ciudad',
      'Intereses',
      'Grado',
      'Personalización',
      'Problemas',
      'Tiene dislexia',
    ];

    const isValid = keys.every((key) => validKeys.includes(key));
    if (!isValid) {
      throw new BadRequestException(
        'El archivo no tiene la estructura correcta. Puede descargar la plantilla',
      );
    }

    // Crear los estudiantes
    for (const student of jsonData) {
      const data = {
        firstName: student['Nombres'],
        lastName: student['Apellidos'],
        identification: `${student['Identificación']}`,
        genre: student['Género'],
        birthDate: new Date(student['Fecha de nacimiento']).toISOString(),
        city: student['Ciudad'],
        interests: student['Intereses'],
        grade: student['Grado'],
        customPrompt: student['Personalización'],
        problems: student['Problemas'],
        courseId,
        haveDyslexia: student['Tiene dislexia'] == 'si' ? true : false,
      };

      await this.createStudents(data, userId);
    }

    return { message: 'Estudiantes creados correctamente' };
  }

  async exportTemplate() {
    const data = [
      {
        Nombres: 'Nombre del estudiante',
        Apellidos: 'Apellido del estudiante',
        Identificación: 'Número de identificación (Cédula)',
        Género: 'Género del estudiante (m/f)',
        'Fecha de nacimiento':
          'Fecha de nacimiento del estudiante (YYYY-MM-DD). Ejemplo: 2000-01-01 (la celda debe ser de tipo texto)',
        Ciudad: 'Ciudad de residencia',
        Intereses: 'Intereses del estudiante',
        Grado: 'Grado del estudiante (1-7)',
        Personalización:
          'Descripción para que la IA tome en cuenta al momento de generar los contenidos',
        Problemas: 'Problemas en el aprendizaje del estudiante',
        'Tiene dislexia': 'si/no',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  }
}
