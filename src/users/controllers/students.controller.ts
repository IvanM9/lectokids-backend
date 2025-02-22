import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { StudentsService } from '../services/students.service';
import { RoleEnum } from '@/security/enums/role.enum';
import { JwtAuthGuard } from '@/security/guards/jwt-auth.guard';
import { RoleGuard } from '@/security/guards/roles.guard';
import { Role } from '@/security/decorators/roles.decorator';
import { CurrentUser } from '@/security/decorators/auth.decorator';
import { InfoUserInterface } from '@/security/interfaces/info-user.interface';
import {
  CreateStudentDto,
  ImportFromExcelDto,
  UpdateStudentDto,
} from '../dtos/students.dto';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ResponseHttpInterceptor } from '@/shared/interceptors/response-http.interceptor';
import { OptionalBooleanPipe } from '@/shared/pipes/optional-boolean.pipe';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';

@Controller('students')
@ApiTags('students')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
export class StudentsController {
  constructor(private service: StudentsService) {}

  @Post()
  @Role(RoleEnum.TEACHER)
  @UseInterceptors(ResponseHttpInterceptor)
  async createStudents(
    @CurrentUser() { id }: InfoUserInterface,
    @Body() data: CreateStudentDto,
  ) {
    return await this.service.createStudents(data, id);
  }

  @Get(':courseId')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @UseInterceptors(ResponseHttpInterceptor)
  @Role(RoleEnum.TEACHER)
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  async getAllStudents(
    @CurrentUser() { id }: InfoUserInterface,
    @Param('courseId') courseId: string,
    @Query('status', OptionalBooleanPipe) status: boolean,
    @Query('search') search?: string,
    @Query('page') page?: number,
  ) {
    return await this.service.getAllMyStudents(
      id,
      courseId,
      search,
      status,
      page,
    );
  }

  @Patch(':studentId')
  @UseInterceptors(ResponseHttpInterceptor)
  @Role(RoleEnum.TEACHER)
  async updateStudent(
    @Param('studentId') studentId: string,
    @Body() data: UpdateStudentDto,
  ) {
    return await this.service.updateStudent(data, studentId);
  }

  @Patch(':studentId/:courseId/status')
  @UseInterceptors(ResponseHttpInterceptor)
  @Role(RoleEnum.TEACHER)
  async changeStatus(
    @Param('studentId') studentId: string,
    @Param('courseId') courseId: string,
  ) {
    return await this.service.updateStudentStatus(studentId, courseId);
  }

  @Get(':identification/by-identification')
  @UseInterceptors(ResponseHttpInterceptor)
  @Role(RoleEnum.TEACHER)
  async getStudentByIdentification(
    @Param('identification') identification: string,
  ) {
    return {
      data: await this.service.getStudentByIdentification(identification),
      message: 'Se buscó al estudiante correctamente',
    };
  }

  @Get()
  @UseInterceptors(ResponseHttpInterceptor)
  @Role(RoleEnum.STUDENT)
  @ApiOperation({ summary: 'Obtener datos del perfil' })
  async getMyProfile(@CurrentUser() { id }: InfoUserInterface) {
    return { data: await this.service.myProfile(id) };
  }

  @Post('import-excel/:courseId')
  @Role(RoleEnum.TEACHER)
  @UseInterceptors(FileInterceptor('file'), ResponseHttpInterceptor)
  @ApiConsumes('multipart/form-data')
  async importStudentsFromExcel(
    @UploadedFile() file: Express.Multer.File,
    @Body() payload: ImportFromExcelDto,
    @CurrentUser() { id }: InfoUserInterface,
    @Param('courseId') courseId: string,
  ) {
    return await this.service.importFromExcel(file, id, courseId);
  }

  @Get('template/excel')
  @Role(RoleEnum.TEACHER)
  async getExcelTemplate(@Res() res: Response) {
    const buffer = await this.service.exportTemplate();

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=nomina_estudiantes.xlsx',
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}
