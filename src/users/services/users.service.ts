import { PrismaService } from '@/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  constructor(private db: PrismaService) {}

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
