import { PrismaService } from '@/prisma.service';
import { Controller } from '@nestjs/common';

@Controller('activities')
export class ActivitiesController {
  constructor(private db: PrismaService) {}
}
