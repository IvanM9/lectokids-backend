import { PrismaService } from '@/prisma.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateLevelDto, UpdateLevelDto } from '../dtos/levels.dto';

@Injectable()
export class LevelsService {
  constructor(private db: PrismaService) {}

  async getAllLevels(courseId: string, userId: string, status?: boolean) {
    return await this.db.level
      .findMany({
        where: {
          course: {
            id: courseId,
            teacher: {
              userId,
            },
          },
          status,
        },
        select: {
          id: true,
          goals: true,
          description: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          name: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      })
      .catch(() => {
        throw new NotFoundException('No se encontraron niveles');
      });
  }

  async createLevel(data: CreateLevelDto, userId: string) {
    await this.db.course
      .findFirstOrThrow({
        where: {
          id: data.courseId,
          teacher: {
            userId,
          },
        },
      })
      .catch(() => {
        throw new NotFoundException('Este curso no existe o no te pertenece');
      });

    await this.db.level
      .create({
        data: {
          goals: data.goals,
          description: data.description,
          course: {
            connect: {
              id: data.courseId,
            },
          },
          name: data.name,
        },
      })
      .catch(() => {
        throw new BadRequestException('No se pudo crear el nivel');
      });

    return { message: 'Nivel creado' };
  }

  async updateLevel(id: string, data: UpdateLevelDto, userId: string) {
    await this.db.level
      .findFirstOrThrow({
        where: {
          id,
          course: {
            teacher: {
              userId,
            },
          },
        },
      })
      .catch(() => {
        throw new NotFoundException('No se encontró el nivel en este curso');
      });

    await this.db.level
      .update({
        where: {
          id,
        },
        data: {
          goals: data.goals,
          description: data.description,
          name: data.name,
        },
      })
      .catch(() => {
        throw new BadRequestException('No se pudo actualizar el nivel');
      });

    return { message: 'Nivel actualizado' };
  }

  async updateStatusLevel(id: string, userId: string) {
    const level = await this.db.level
      .findFirstOrThrow({
        where: {
          id,
          course: {
            teacher: {
              userId,
            },
          },
        },
      })
      .catch(() => {
        throw new NotFoundException('No se encontró el nivel en este curso');
      });

    await this.db.level
      .update({
        where: {
          id,
        },
        data: {
          status: !level.status,
        },
      })
      .catch(() => {
        throw new BadRequestException('No se pudo actualizar el nivel');
      });

    return { message: 'Nivel actualizado' };
  }
}
