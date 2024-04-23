import {
  Controller,
  Get,
  Param,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from '@/users/services/users.service';
import { RoleGuard } from '@/security/jwt-strategy/roles.guard';
import { JwtAuthGuard } from '@/security/jwt-strategy/jwt-auth.guard';
import { Role } from '@/security/jwt-strategy/roles.decorator';
import { RoleEnum } from '@/security/jwt-strategy/role.enum';
import { ResponseHttpInterceptor } from '@/shared/interceptors/response-http.interceptor';
import { CurrentUser } from '@/security/jwt-strategy/auth.decorator';
import { InfoUserInterface } from '@/security/jwt-strategy/info-user.interface';

@Controller('users')
@ApiTags('users')
@UseInterceptors(ResponseHttpInterceptor)
@ApiBearerAuth()
export class UsersController {
  constructor(private service: UsersService) {}

  @Get('students/:courseId')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Role(RoleEnum.TEACHER)
  async getAllStudents(
    @CurrentUser() { id }: InfoUserInterface,
    @Param('courseId') courseId: string,
  ) {
    return { data: await this.service.getAllMyStudents(id, courseId) };
  }

  @Get('teachers')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Role(RoleEnum.ADMIN)
  async getAllTeachers() {
    return { data: await this.service.getAllTeachers() };
  }
}
