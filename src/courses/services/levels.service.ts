import { PrismaService } from '@/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LevelsService {
  constructor(private db: PrismaService) {}

  async getAllLevels() {
    return await this.db.level.findMany();
  }
}
