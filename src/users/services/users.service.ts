import { PrismaService } from '@/prisma.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { hashSync } from 'bcrypt';
import { CreateUserDto } from '../dtos/users.dto';

@Injectable()
export class UsersService {
  constructor(private db: PrismaService) {
    this.createAdmin();
  }

  async createAdmin() {
    const existAdmin = await this.db.user.findFirst({
      where: {
        role: Role.TEACHER,
      },
    });

    if (!existAdmin) {
      await this.db.user.create({
        data: {
          user: 'admin',
          password: hashSync('admin', 10),
          role: Role.TEACHER,
          identification: 'admin',
          birthDate: new Date(),
          teacher: {
            create: {
              isPending: false,
            },
          },
        },
      });
    }
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

  async createTeacher(data: CreateUserDto) {
    await this.db.teacher
      .findFirst({
        where: {
          user: {
            identification: data.identification,
          },
        },
      })
      .then((teacher) => {
        if (teacher) {
          throw new BadRequestException(
            'Ya existe un profesor con esa identificación',
          );
        }
      });

    return await this.db.teacher
      .create({
        data: {
          user: {
            create: {
              password: hashSync(data.identification, 10),
              role: Role.TEACHER,
              identification: data.identification,
              firstName: data.firstName,
              lastName: data.lastName,
              birthDate: data.birthDate,
              genre: data.genre,
              user: data.identification,
            },
          },
          isPending: true,
        },
      })
      .catch(() => {
        throw new BadRequestException('No se pudo crear el profesor');
      });
  }
}
