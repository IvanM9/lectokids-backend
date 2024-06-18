import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CoursesService } from '../services/courses.service';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ResponseHttpInterceptor } from '@/shared/interceptors/response-http.interceptor';
import { JwtAuthGuard } from '@/security/jwt-strategy/jwt-auth.guard';
import { RoleGuard } from '@/security/jwt-strategy/roles.guard';
import { CurrentUser } from '@/security/jwt-strategy/auth.decorator';
import { InfoUserInterface } from '@/security/jwt-strategy/info-user.interface';
import { CreateCoursesDto } from '../dtos/courses.dto';
import { Role } from '@/security/jwt-strategy/roles.decorator';
import { RoleEnum } from '@/security/jwt-strategy/role.enum';
import { OptionalBooleanPipe } from '@/shared/pipes/optional-boolean.pipe';

@Controller('courses')
@ApiTags('courses')
@UseInterceptors(ResponseHttpInterceptor)
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Role(RoleEnum.TEACHER)
export class CoursesController {
  constructor(private service: CoursesService) {}

  @Get()
  @ApiQuery({ name: 'status', required: false })
  async getAllCourses(
    @CurrentUser() { id }: InfoUserInterface,
    @Query('status', OptionalBooleanPipe) status?: boolean,
  ) {
    return { data: await this.service.getAllCourses(id, status) };
  }

  @Post()
  async createCourse(
    @CurrentUser() { id }: InfoUserInterface,
    @Body() data: CreateCoursesDto,
  ) {
    return await this.service.createCourse(id, data);
  }

  @Patch(':courseId')
  async updateCourse(
    @CurrentUser() { id }: InfoUserInterface,
    @Body() data: CreateCoursesDto,
    @Param('courseId') courseId: string,
  ) {
    return await this.service.updateCourse(id, courseId, data);
  }

  @Patch(':courseId/status')
  async updateStatusCourse(
    @CurrentUser() { id }: InfoUserInterface,
    @Param('courseId') courseId: string,
  ) {
    return await this.service.updateStatusCourse(id, courseId);
  }

  @Get('student')
  @Role(RoleEnum.STUDENT)
  async getAllCoursesStudent(@CurrentUser() { id }: InfoUserInterface) {
    return { data: await this.service.getAllCoursesStudent(id) };
  }
}
