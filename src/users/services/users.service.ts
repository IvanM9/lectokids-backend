import { PrismaService } from '@/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  constructor(private db: PrismaService) {}

  async getAllMyStudents(teacherId: string) {
    return await this.db.student.findMany({
      where: {
        coursesStudent: { some: { course: { teacher: { id: teacherId } } } },
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
}
