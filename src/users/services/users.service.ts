import { PrismaService } from '@/prisma.service';
import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { hashSync } from 'bcrypt';

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
}
