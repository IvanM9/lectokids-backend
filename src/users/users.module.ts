import { Logger, Module } from '@nestjs/common';
import { UsersService } from './services/users.service';
import { UsersController } from './controllers/users.controller';
import { PrismaService } from '@/libs/prisma.service';
import { StudentsService } from './services/students.service';
import { StudentsController } from './controllers/students.controller';

@Module({
  controllers: [UsersController, StudentsController],
  providers: [UsersService, PrismaService, StudentsService, Logger],
})
export class UsersModule {}
