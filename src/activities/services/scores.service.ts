import { PrismaService } from '@/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ScoresService {
  constructor(private db: PrismaService) {}

  async getScoreByActivity(activityId: string) {
    return this.db.score.findMany({
      where: {
        activityId,
      },
    });
  }
}
