import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CoursesService } from '../services/courses.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ResponseHttpInterceptor } from '@/shared/interceptors/response-http.interceptor';
import { JwtAuthGuard } from '@/security/jwt-strategy/jwt-auth.guard';
import { RoleGuard } from '@/security/jwt-strategy/roles.guard';
import { CurrentUser } from '@/security/jwt-strategy/auth.decorator';
import { InfoUserInterface } from '@/security/jwt-strategy/info-user.interface';
import { CreateCoursesDto } from '../dtos/courses.dto';
import { Role } from '@/security/jwt-strategy/roles.decorator';
import { RoleEnum } from '@/security/jwt-strategy/role.enum';

@Controller('courses')
@ApiTags('courses')
@UseInterceptors(ResponseHttpInterceptor)
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
export class CoursesController {
  constructor(private service: CoursesService) {}

  @Get()
  @Role(RoleEnum.TEACHER)
  async getAllCourses(@CurrentUser() { id }: InfoUserInterface) {
    return { data: await this.service.getAllCourses(id) };
  }

  @Post()
  @Role(RoleEnum.TEACHER)
  async createCourse(
    @CurrentUser() { id }: InfoUserInterface,
    @Body() data: CreateCoursesDto,
  ) {
    return await this.service.createCourse(id, data);
  }
}
