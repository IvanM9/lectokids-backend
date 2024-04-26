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
import { StudentsService } from '../services/students.service';
import { RoleEnum } from '@/security/jwt-strategy/role.enum';
import { JwtAuthGuard } from '@/security/jwt-strategy/jwt-auth.guard';
import { RoleGuard } from '@/security/jwt-strategy/roles.guard';
import { Role } from '@/security/jwt-strategy/roles.decorator';
import { CurrentUser } from '@/security/jwt-strategy/auth.decorator';
import { InfoUserInterface } from '@/security/jwt-strategy/info-user.interface';
import { CreateStudentDto, UpdateStudentDto } from '../dtos/students.dto';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ResponseHttpInterceptor } from '@/shared/interceptors/response-http.interceptor';
import { OptionalBooleanPipe } from '@/shared/pipes/optional-boolean.pipe';

@Controller('students')
@ApiTags('students')
@UseInterceptors(ResponseHttpInterceptor)
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
export class StudentsController {
  constructor(private service: StudentsService) {}

  @Post()
  @Role(RoleEnum.TEACHER)
  async createStudents(
    @CurrentUser() { id }: InfoUserInterface,
    @Body() data: CreateStudentDto,
  ) {
    return await this.service.createStudents(data, id);
  }

  @Get(':courseId')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Role(RoleEnum.TEACHER)
  @ApiQuery({ name: 'status', required: false })
  async getAllStudents(
    @CurrentUser() { id }: InfoUserInterface,
    @Param('courseId') courseId: string,
    @Query('status', OptionalBooleanPipe) status: boolean,
  ) {
    return { data: await this.service.getAllMyStudents(id, courseId, status) };
  }

  @Patch(':studentId')
  @Role(RoleEnum.TEACHER)
  async updateStudent(
    @Param('studentId') studentId: string,
    @Body() data: UpdateStudentDto,
  ) {
    return await this.service.updateStudent(data, studentId);
  }

  @Patch(':studentId/status')
  @Role(RoleEnum.TEACHER)
  async changeStatus(@Param('studentId') studentId: string) {
    return await this.service.updateStudentStatus(studentId);
  }
}
