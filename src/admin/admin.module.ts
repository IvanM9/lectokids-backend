import { Logger, Module } from '@nestjs/common';
import { AdminService } from './services/admin.service';
import { AdminController } from './controllers/admin.controller';
import { PrismaService } from '@/libs/prisma.service';

@Module({
  providers: [AdminService, PrismaService, Logger],
  controllers: [AdminController]
})
export class AdminModule {}
