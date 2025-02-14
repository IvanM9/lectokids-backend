import { Logger, Module } from '@nestjs/common';
import { UsersService } from './services/users.service';
import { UsersController } from './controllers/users.controller';
import { PrismaService } from '@/libs/prisma.service';
import { StudentsService } from './services/students.service';
import { StudentsController } from './controllers/students.controller';
import { ConfigModule } from '@nestjs/config';
import adminConfig from './config/admin.config';

@Module({
  controllers: [UsersController, StudentsController],
  providers: [UsersService, PrismaService, StudentsService, Logger],
  imports: [ConfigModule.forFeature(adminConfig)],
})
export class UsersModule {}
