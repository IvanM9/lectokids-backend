import { PrismaService } from '@/libs/prisma.service';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { hashSync } from 'bcrypt';
import { CreateUserDto } from '../dtos/users.dto';
import adminConfig from '../config/admin.config';
import { ConfigType } from '@nestjs/config';
import { PaginationDto } from '@/shared/dtos/pagination.dto';

@Injectable()
export class UsersService {
  constructor(
    private db: PrismaService,
    private logger: Logger,
    @Inject(adminConfig.KEY)
    private environment: ConfigType<typeof adminConfig>,
  ) {
    this.createAdmin();
  }

  async createAdmin() {
    const existAdmin = await this.db.user.findFirst({
      where: {
        role: Role.ADMIN,
      },
    });

    if (!existAdmin) {
      await this.db.user
        .create({
          data: {
            user: this.environment.user,
            password: hashSync(this.environment.password, 10),
            role: Role.ADMIN,
            identification: 'admin',
            birthDate: new Date(),
          },
        })
        .catch((err) => {
          this.logger.error(err.message, err.stack, UsersService.name);
          throw new BadRequestException(
            'No se pudo crear el usuario administrador',
          );
        });
    }
  }

  async getAllTeachers(pagination: PaginationDto) {
    const { page, limit, search, status }: PaginationDto = pagination;

    const teachers = await this.db.teacher.findMany({
      select: {
        id: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            status: true,
            genre: true,
            birthDate: true,
            identification: true,
          },
        },
        createdAt: true,
        updatedAt: true,
        isPending: true,
      },
      where: {
        user: {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
          ],
          status: status,
          role: Role.TEACHER,
        },
      },
      skip: page,
      take: limit,
      orderBy: {
        user: {
          firstName: 'asc',
        },
      },
    });

    const total = await this.db.teacher.count({
      where: {
        user: {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
          ],
          status: status,
          role: Role.TEACHER,
        },
      },
    });

    return {
      teachers,
      total,
    };
  }

  async createTeacher(data: CreateUserDto) {
    const existTeacher = await this.db.teacher.findFirst({
      where: {
        user: {
          OR: [
            { user: data.user ?? data.identification },
            { identification: data.identification },
            { email: data.email },
          ],
        },
      },
    });

    if (existTeacher) {
      throw new BadRequestException(
        'Ya existe un profesor con esa identificación, usuario o correo electrónico',
      );
    }

    return await this.db.teacher
      .create({
        data: {
          user: {
            create: {
              password: hashSync(data.password ?? data.identification, 10),
              role: Role.TEACHER,
              identification: data.identification,
              firstName: data.firstName,
              lastName: data.lastName,
              birthDate: data.birthDate,
              genre: data.genre,
              user: data.user ?? data.identification,
              email: data.email,
            },
          },
          isPending: data.isPending ?? true,
        },
      })
      .catch((err) => {
        this.logger.error(err.message, err.stack, UsersService.name);
        throw new BadRequestException('No se pudo crear el profesor');
      });
  }

  async activateTeacher(id: string) {
    return await this.db.teacher
      .update({
        where: {
          id,
        },
        data: {
          isPending: false,
        },
      })
      .catch((err) => {
        this.logger.error(err.message, err.stack, UsersService.name);
        throw new BadRequestException('No se pudo aceptar al profesor');
      });
  }

  async updateStatusTeacher(id: string) {
    const teacher = await this.db.teacher
      .findUniqueOrThrow({
        where: {
          id,
        },
        select: {
          user: {
            select: {
              status: true,
            },
          },
        },
      })
      .catch((err) => {
        this.logger.error(err.message, err.stack, UsersService.name);
        throw new NotFoundException('No se pudo encontrar el profesor');
      });

    await this.db.teacher
      .update({
        where: {
          id,
        },
        data: {
          user: {
            update: {
              status: !teacher.user.status,
            },
          },
        },
      })
      .catch((err) => {
        this.logger.error(err.message, err.stack, UsersService.name);
        throw new BadRequestException('No se pudo actualizar el profesor');
      });

    return 'Profesor actualizado correctamente';
  }

  async generalInfo(userId: string) {
    const teacher = await this.db.teacher
      .findFirstOrThrow({
        where: {
          userId,
        },
        select: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      })
      .catch((err) => {
        this.logger.error(err.message, err.stack, UsersService.name);
        throw new NotFoundException('No se pudo encontrar el profesor');
      });

    const courses = await this.db.course.findMany({
      where: {
        teacher: {
          userId,
        },
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            courseStudents: true,
            levels: true,
          },
        },
        levels: {
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                readings: {
                  where: {
                    status: true,
                  },
                },
              },
            },
            readings: {
              select: {
                id: true,
                title: true,
              },
              where: {
                status: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    return { data: { courses, teacher } };
  }
}
